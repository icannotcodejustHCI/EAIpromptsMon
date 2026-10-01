import { DurableObject } from 'cloudflare:workers';

export function mongoliaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ulaanbaatar', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export class VisitCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS totals (id INTEGER PRIMARY KEY CHECK(id = 1), value INTEGER NOT NULL)');
    this.sql.exec('INSERT OR IGNORE INTO totals (id, value) VALUES (1, 0)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, value INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS seen (day TEXT NOT NULL, visitor_hash TEXT NOT NULL, PRIMARY KEY(day, visitor_hash))');
  }
  async fetch(request) {
    const { day, visitorHash } = await request.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || (visitorHash && !/^[0-9a-f]{64}$/.test(visitorHash))) return new Response('Invalid internal request', { status: 400 });
    let counts;
    this.ctx.storage.transactionSync(() => {
      if (visitorHash) {
        const existing = Array.from(this.sql.exec('SELECT 1 AS present FROM seen WHERE day = ? AND visitor_hash = ?', day, visitorHash));
        if (!existing.length) {
          this.sql.exec('INSERT INTO seen (day, visitor_hash) VALUES (?, ?)', day, visitorHash);
          this.sql.exec('INSERT INTO daily (day, value) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET value = value + 1', day);
          this.sql.exec('UPDATE totals SET value = value + 1 WHERE id = 1');
        }
      }
      const today = Array.from(this.sql.exec('SELECT value FROM daily WHERE day = ?', day))[0]?.value || 0;
      const total = Array.from(this.sql.exec('SELECT value FROM totals WHERE id = 1'))[0].value;
      counts = { today, total, date: day, timezone: 'Asia/Ulaanbaatar' };
      // Store only daily hashes for recent deduplication; the cumulative total persists.
      const cutoff = new Date(`${day}T00:00:00Z`);
      cutoff.setUTCDate(cutoff.getUTCDate() - 7);
      this.sql.exec('DELETE FROM seen WHERE day < ?', cutoff.toISOString().slice(0, 10));
    });
    return Response.json(counts);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return new Response('Origin not allowed', { status: 403 });
    const headers = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    if (new URL(request.url).pathname !== '/stats') return new Response('Not found', { status: 404, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    if (!['GET', 'POST'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers });
    let visitorHash = null;
    const day = mongoliaDate();
    if (request.method === 'POST') {
      try {
        const raw = await request.text();
        if (raw.length > 512) return new Response('Request too large', { status: 413, headers });
        const { visitor } = JSON.parse(raw);
        if (typeof visitor !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitor)) return new Response('Invalid visitor', { status: 400, headers });
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${day}:${visitor.toLowerCase()}`));
        visitorHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      } catch { return new Response('Invalid JSON', { status: 400, headers }); }
    }
    try {
      const stub = env.COUNTER.get(env.COUNTER.idFromName('eai-mongolia'));
      const result = await stub.fetch(new Request('https://counter.internal/', { method: 'POST', body: JSON.stringify({ day, visitorHash }) }));
      return new Response(result.body, { status: result.status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
    } catch { return new Response('Counter unavailable', { status: 503, headers }); }
  }
};
