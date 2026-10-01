# UpToDate Expert AI · Mongolia Prompt Library

GitHub repository `icannotcodejustHCI/EAIpromptsMon`의 별도 몽골어 사이트다. 기존 `EAI-Prompts`에는 변경하지 않는다.

## 포함 내용

- 기존 임상 케이스 20개와 모든 질문의 몽골어 번역.
- 신규 임상 케이스 10개: 성인·소아 CAP, 간염 선별검사, HBV·HCV 치료, HCC 감시·치료, 산후출혈, 손 습진, 소아 아토피피부염.
- 프롬프트에서 국가·도시·지역명과 지역별 의료자원 제한 가정을 제거했다. 일반 임상 근거에 집중한다.
- 진료과 16개, 신규 케이스는 각 진료과의 앞에 표시.
- 기존 레이아웃을 바탕으로 한 몽골어 제목, 안내, 버튼, 오류 메시지, 관리자 화면.
- 프롬프트 제출/공유 영역 제거. 문의는 Mongolia 담당 Jiseong Kim, 이메일은 jiseong.kim@wolterskluwer.com.
- 첫 질문은 케이스와 질문을 함께 복사. 후속 질문은 질문만 복사하여 같은 대화에 이어 넣는다.
- 우하단에 작은 Today / Total 카운터. 실제 집계 서비스 연결 전에는 — 표시.

약물명·의학 약어·수치·단위를 유지했다. 번역문은 AI 초안이며 몽골어 의료진의 최종 검토와 Expert AI 실제 응답 테스트는 아직 하지 않았다. 기본 케이스의 임상적 전제와 질문은 원본대로 유지했다.

## 새 repository와 GitHub Pages

사이트 파일은 repository 루트에 둔다. GitHub Pages 활성화 방법:

1. Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save.
2. 게시 후 주소는 `https://icannotcodejusthci.github.io/EAIpromptsMon/`이다. 이 문서에 적힌 주소는 예상 주소이며 게시 완료를 의미하지 않는다.

다른 repository 이름도 가능하다. 관리자 기능은 GitHub Pages 주소에서 owner/repo를 자동 인식한다. 다른 호스팅에서는 `config.js`에 실제 owner/repo를 설정한다. 관리자 토큰은 새 repository에만 권한을 부여한다.

## 방문 카운터 연결

GitHub Pages는 정적 호스팅이라 서버에 방문 수를 저장할 수 없다. 이 프로젝트에는 Cloudflare Worker + SQLite Durable Object 카운터 코드를 함께 넣었다. Cloudflare 계정에서 배포해야 숫자가 실제로 집계된다.

1. Cloudflare 계정을 준비하고 터미널에서 `counter-worker` 폴더로 이동한다.
2. `npx wrangler login` 후 `npx wrangler deploy`를 실행한다.
3. 출력된 Worker 주소 뒤에 `/stats`를 붙여 `config.js`의 `counterEndpoint`에 넣고 GitHub에 저장한다. 예: `https://eai-mongolia-visitor-counter.<your-subdomain>.workers.dev/stats`.
4. 다른 도메인으로 게시한다면 `counter-worker/wrangler.jsonc`의 `ALLOWED_ORIGINS`도 실제 사이트 origin으로 변경하고 재배포한다. origin에는 경로를 넣지 않는다.

### 집계 기준

- Today: 울란바토르 시간(UTC+8)으로 해당 날짜에 방문한 브라우저 수.
- Total: 일별 브라우저 방문 수의 누적 합. 전체 기간의 고유 사람 수는 아니다.
- 같은 브라우저의 같은 날짜 새로고침/다른 탭은 서버에서 중복 집계하지 않는다.
- 다음 날짜 재방문은 Today와 Total에 각각 1을 추가한다.
- 숫자는 모든 방문자에게 공통이며 Worker의 지속 저장소에 저장된다.
- 이메일·환자정보·IP를 카운터 DB에 저장하지 않는다. 브라우저에는 임의 UUID를 보관하고 서버 DB에는 날짜별 hash만 7일가량 보관한다.
- 브라우저 저장소가 차단되면 숫자만 조회한다. 새로고침마다 새 방문자로 만들지 않는다.
- 서비스 미연결/오류 시 — 를 표시하며 임의 숫자나 로컬 개인 카운터로 대체하지 않는다.
- 시크릿 모드, 저장소 삭제, 다른 브라우저는 별도 방문으로 집계된다. 봇을 완벽하게 구분하는 분석 서비스는 아니며 CORS는 인증 수단이 아니다.

## 케이스 수정

`cases.json`의 `specialties`와 `cases`를 편집하거나 페이지 하단의 몽골어 관리자 화면을 사용한다. GitHub fine-grained PAT의 Contents: Read and write 권한이 필요하다. 토큰은 서버·브라우저 저장소에 저장하지 않고 모달을 닫으면 입력값을 지운다.

## 참고 문서

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Cloudflare SQLite Durable Objects: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- CAP: https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults/
- 소아 폐렴: https://www.who.int/publications/i/item/9789240103412
- HBV: https://www.who.int/publications/i/item/9789240090903
- HCV: https://www.hcvguidelines.org/
- HCC: https://pubmed.ncbi.nlm.nih.gov/37199193/
- 산후출혈: https://www.who.int/publications/i/item/9789240115637
