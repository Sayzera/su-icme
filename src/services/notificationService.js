// Notification servisi - Chrome Notification API kullanarak bildirim gönderme

/**
 * Notification izni iste
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Bu tarayıcı bildirimleri desteklemiyor.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Bildirim göster
 */
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('Bu tarayıcı bildirimleri desteklemiyor.');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg', // Varsayılan icon
      badge: '/vite.svg',
      ...options
    });

    // Bildirim tıklandığında pencereyi odakla
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Bildirimi otomatik kapat (5 saniye sonra)
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } else if (Notification.permission !== 'denied') {
    // İzin henüz verilmemişse tekrar iste
    requestNotificationPermission().then(permission => {
      if (permission) {
        showNotification(title, options);
      }
    });
  }
};

/**
 * Görev tamamlandı bildirimi göster
 */
export const showTaskCompletedNotification = (userEmail, timeRangeLabel) => {
  // Bildirim izni kontrolü
  if (!('Notification' in window)) {
    console.log('Bu tarayıcı bildirimleri desteklemiyor.');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Bildirim izni verilmemiş.');
    return;
  }

  const title = '💧 Yeni Görev Tamamlandı!';
  const body = `${userEmail} ${timeRangeLabel} görevini tamamladı!`;
  
  try {
    showNotification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: `task-completed-${Date.now()}`, // Her bildirimi benzersiz yap
      requireInteraction: false,
      silent: false
    });
  } catch (error) {
    console.error('Bildirim gösterilirken hata oluştu:', error);
  }
};

