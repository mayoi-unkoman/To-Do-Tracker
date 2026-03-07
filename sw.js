/* ========================================
   Service Worker — sw.js
   通知表示 + Push通知受信
   ======================================== */

const CACHE_NAME = 'habit-tracker-v3';
const ASSETS = [
    './index.html',
    './app.js',
    './style.css',
    './icon.jpg',
    './manifest.json'
];

// ---- インストール ----
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// ---- アクティベート（古いキャッシュ削除） ----
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ---- フェッチ（iOS Safari対応） ----
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).then(res => {
                if (res.redirected) {
                    return new Response(res.body, {
                        status: res.status,
                        statusText: res.statusText,
                        headers: res.headers
                    });
                }
                return res;
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then(cached => {
            if (cached && !cached.redirected) return cached;
            return fetch(req);
        })
    );
});

// ---- メインスレッドからのメッセージ受信 ----
self.addEventListener('message', event => {
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
        case 'SHOW_NOTIFICATION':
            self.registration.showNotification(data.title || '習慣トラッカー', {
                body: data.body || '',
                icon: './icon.jpg',
                badge: './icon.jpg',
                tag: data.tag || 'habit-notify',
                requireInteraction: false,
                data: {
                    taskId: data.taskId || null,
                    url: './index.html'
                }
            });
            break;

        case 'PING':
            if (event.source) {
                event.source.postMessage({ type: 'PONG' });
            }
            break;
    }
});

// ---- Push通知受信（サーバーからのPush） ----
self.addEventListener('push', event => {
    let data = { title: '習慣トラッカー', body: 'タスクを確認してください' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        // JSONパース失敗時はデフォルトメッセージ
    }

    event.waitUntil(
        self.registration.showNotification(data.title || '習慣トラッカー', {
            body: data.body || 'タスクを確認してください',
            icon: './icon.jpg',
            badge: './icon.jpg',
            tag: 'habit-push-' + Date.now(),
            requireInteraction: false,
            data: { url: './index.html?view=today&autoCheck=true' }
        })
    );
});

// ---- 通知クリック処理 ----
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const urlToOpen = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : './index.html';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            for (const client of clients) {
                if (client.url.includes('index.html') || client.url.endsWith('/')) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(urlToOpen);
        })
    );
});
