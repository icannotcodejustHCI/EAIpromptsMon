(() => {
  const widget = document.querySelector('.visitor-count');
  const endpoint = (window.SITE_CONFIG || {}).counterEndpoint;
  if (!endpoint) {
    widget.title = 'Хандалтын тоолуур хараахан холбогдоогүй байна.';
    widget.dataset.state = 'unconfigured';
    return;
  }
  let visitor = null;
  try {
    visitor = localStorage.getItem('eai-mn-visitor');
    if (!visitor || !/^[0-9a-f-]{36}$/i.test(visitor)) {
      visitor = crypto.randomUUID();
      localStorage.setItem('eai-mn-visitor', visitor);
    }
  } catch {
    // Without browser storage, only read counts; do not inflate totals on refresh.
  }
  async function refresh() {
    try {
      const response = await fetch(endpoint, {
        method: visitor ? 'POST' : 'GET',
        ...(visitor ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitor }) } : {}),
        signal: AbortSignal.timeout(8000), cache: 'no-store', credentials: 'omit'
      });
      if (!response.ok) throw Error('Counter unavailable');
      const counts = await response.json();
      if (!Number.isSafeInteger(counts.today) || !Number.isSafeInteger(counts.total) || counts.today < 0 || counts.total < counts.today) throw Error('Invalid counts');
      document.getElementById('countToday').textContent = counts.today.toLocaleString('mn-MN');
      document.getElementById('countTotal').textContent = counts.total.toLocaleString('mn-MN');
      widget.dataset.state = 'live';
      widget.title = 'Улаанбаатарын цагаар нэг хөтчийг өдөрт нэг удаа тоолно. Total нь өдөр тутмын хандалтын нийлбэр.';
    } catch {
      document.getElementById('countToday').textContent = '—';
      document.getElementById('countTotal').textContent = '—';
      widget.dataset.state = 'unavailable';
      widget.title = 'Хандалтын тоог одоогоор авах боломжгүй байна.';
    }
  }
  refresh();
  // Re-evaluate date after a long-open tab, including midnight in Mongolia.
  setInterval(() => { if (!document.hidden) refresh(); }, 300000);
})();
