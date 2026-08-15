// Resonance Bowl PWA Service Worker
const CACHE_NAME = 'resonance-bowl-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装事件 - 缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('打开缓存:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 网络优先，失败则用缓存
self.addEventListener('fetch', event => {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 网络成功，缓存响应
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // 网络失败，尝试缓存
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // 如果是导航请求，返回主页
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('离线状态', { status: 503 });
          });
      })
  );
});

// 消息处理 - 用于控制缓存
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});