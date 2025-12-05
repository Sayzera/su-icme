# 💧 Su İçme Takip Uygulaması

Günlük su içme görevlerini takip etmek için Firebase tabanlı bir React uygulaması.

## Özellikler

- 🔐 Firebase Authentication ile kullanıcı girişi/kayıt
- 📅 Günlük görev takibi (belirli saat aralıklarında)
- ✅ Görev tamamlama/geri alma
- 📊 Günlük ilerleme takibi
- 👥 Takım görünümü - diğer kullanıcıların görevlerini görüntüleme
- 🔥 Firestore ile gerçek zamanlı veri senkronizasyonu
- 📧 Kullanıcı email'lerini Firestore'da saklama ve görüntüleme
- 🎨 Modern ve kullanıcı dostu arayüz

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
pnpm install
```

2. Firebase yapılandırmasını yapın:
   - `src/config/firebase.js` dosyasındaki Firebase yapılandırma bilgilerini doldurun
   - Firebase Console'da Firestore Database'i oluşturun
   - Authentication'ı etkinleştirin (Email/Password)

3. Firestore Güvenlik Kuralları:
   
   **ÖNEMLİ:** `FIRESTORE_RULES.txt` dosyasındaki kuralları Firebase Console'a kopyalayın!
   
   Firebase Console > Firestore Database > Rules sekmesine gidin ve `FIRESTORE_RULES.txt` dosyasındaki kuralları yapıştırın, ardından **Publish** butonuna tıklayın.
   
   Veya manuel olarak aşağıdaki kuralları kullanın:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow get: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        (resource.data.date != null && resource.data.date >= timestamp.date(2024, 1, 1))
      );
      allow list: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Uygulamayı çalıştırın:
```bash
pnpm dev
```

## Kullanım

1. Uygulamaya kayıt olun veya giriş yapın
2. Günlük görevlerinizi görüntüleyin
3. Her saat aralığında su içme görevini tamamlayın
4. İlerlemenizi takip edin

## Teknolojiler

- React 19
- Vite
- Firebase (Authentication & Firestore)
- React Router DOM (HashRouter)
- Context API

## Görev Zaman Aralıkları

- 09:00 - 11:00
- 11:00 - 14:00
- 14:00 - 17:00
- 17:00 - 20:00

Bu aralıklar `src/contexts/TaskContext.jsx` dosyasından özelleştirilebilir.
