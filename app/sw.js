// 앱 코드 변경 시 버전 번호를 올려주세요 (캐시 자동 갱신)
const CACHE_VERSION = '20260609';
const CACHE_NAME = `golf-reg-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './rules.js',
  './ai.js',
  './export.js',
  './match.js',
  './data/match_tree.json',
  './data/shaft_index.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      // 일부 자원 실패해도 전체 설치는 진행
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
  // 동적 데이터(API/프록시/스토어)는 캐시 우회 — 항상 네트워크
  const url = e.request.url;
  if (url.includes('api.anthropic.com') ||
      url.includes('corsproxy.io') ||
      url.includes('golftradingpost.ca')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 네트워크 성공 시 캐시 갱신 (정적 자산만)
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
