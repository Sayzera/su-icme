// Firebase Messaging Service Worker
// Bu dosya background push notifications için gerekli

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase yapılandırması
firebase.initializeApp({
  apiKey: "AIzaSyDCmIUF1QYrNUcI96FXntY8vWUHNj9vHTA",
  authDomain: "gorev-tamamla-fc301.firebaseapp.com",
  projectId: "gorev-tamamla-fc301",
  storageBucket: "gorev-tamamla-fc301.firebasestorage.app",
  messagingSenderId: "776336909982",
  appId: "1:776336909982:web:3bfe5b7ca0c050b2537d8f"
});

const messaging = firebase.messaging();

// Background mesajları işle
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background mesaj alındı:', payload);

  const notificationTitle = payload.notification?.title || '💧 Su İçme Hatırlatıcı';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir bildirim var!',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'water-reminder',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Aç' },
      { action: 'close', title: 'Kapat' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirim tıklandığında
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Bildirime tıklandı:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Uygulamayı aç
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Zaten açık bir pencere varsa odaklan
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

