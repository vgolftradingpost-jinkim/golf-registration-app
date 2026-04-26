// 앱 코드나 DB 변경 시 버전 번호를 올려주세요 (캐시 자동 갱신)
const CACHE_VERSION = 'v6';
const CACHE_NAME = `golf-reg-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './golf_db.json',   // DB 오프라인 지원 (1.9MB — 최초 설치 시 캐시)
  './brands.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      // golf_db.json은 크므로 개별 실패 시 전체 설치 실패 방지
      Promise.allSettled(ASSETS.map(url => c.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // API 호출은 캐시 우회 (항상 네트워크 직접 요청)
  if (e.request.url.includes('api.anthropic.com')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 네트워크 성공 시 캐시 갱신 (golf_db.json 등 정적 자산)
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
