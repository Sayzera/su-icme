# Firestore Veritabanı Yapısı

Bu uygulama Firestore kullanarak verileri saklar. İşte koleksiyonlar ve veri yapıları:

## Koleksiyonlar

### 1. `tasks` Koleksiyonu

Günlük görevleri saklar.

**Doküman Yapısı:**
```javascript
{
  userId: string,           // Kullanıcı ID'si (Firebase Auth UID)
  timeRangeId: number,      // Zaman aralığı ID'si (1-4)
  date: Timestamp,          // Görev tarihi (sadece tarih, saat 00:00:00)
  completed: boolean,       // Görev tamamlandı mı?
  completedAt: Timestamp | null  // Tamamlanma zamanı
}
```

**Örnek:**
```javascript
{
  userId: "abc123...",
  timeRangeId: 1,
  date: Timestamp(2024, 1, 15, 0, 0, 0),
  completed: true,
  completedAt: Timestamp(2024, 1, 15, 10, 30, 0)
}
```

### 2. `users` Koleksiyonu

Kullanıcı bilgilerini saklar.

**Doküman Yapısı:**
```javascript
{
  email: string,            // Kullanıcı email adresi
  createdAt: Timestamp,     // Hesap oluşturulma tarihi
  updatedAt: Timestamp      // Son güncelleme tarihi
}
```

**Örnek:**
```javascript
{
  email: "kullanici@example.com",
  createdAt: Timestamp(2024, 1, 10, 12, 0, 0),
  updatedAt: Timestamp(2024, 1, 15, 10, 0, 0)
}
```

## Firestore Güvenlik Kuralları

**ÖNEMLİ:** Bu kuralları Firebase Console'da Firestore Database > Rules sekmesine yapıştırın!

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tasks koleksiyonu
    match /tasks/{taskId} {
      // Tek bir görevi okuma - kullanıcı kendi görevini veya bugünün görevlerini okuyabilir
      allow get: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        (resource.data.date != null && resource.data.date >= timestamp.date(2024, 1, 1))
      );
      
      // Liste sorgusu - tüm kullanıcılar bugünün görevlerini okuyabilir (takım görünümü için)
      allow list: if request.auth != null;
      
      // Görev oluşturma - sadece kendi görevlerini oluşturabilir
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId &&
        request.resource.data.date != null &&
        request.resource.data.timeRangeId != null;
      
      // Görev güncelleme - sadece kendi görevlerini güncelleyebilir
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Görev silme - sadece kendi görevlerini silebilir
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users koleksiyonu
    match /users/{userId} {
      // Tüm kullanıcılar okuyabilir (email görüntüleme için)
      allow read: if request.auth != null;
      
      // Sadece kendi bilgilerini yazabilir
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Kuralları Uygulama Adımları:

1. Firebase Console'a gidin: https://console.firebase.google.com
2. Projenizi seçin
3. Sol menüden **Firestore Database** > **Rules** sekmesine gidin
4. Yukarıdaki kuralları kopyalayıp yapıştırın
5. **Publish** butonuna tıklayın

## Veri Akışı

1. **Kullanıcı Kaydı:**
   - Firebase Authentication'da hesap oluşturulur
   - `users` koleksiyonuna kullanıcı bilgileri kaydedilir

2. **Görev Oluşturma:**
   - Kullanıcı bir görevi tamamladığında `tasks` koleksiyonuna kayıt eklenir
   - Görev zaten varsa `updateDoc` ile güncellenir

3. **Takım Görünümü:**
   - Bugünün tüm görevleri sorgulanır
   - Her kullanıcı için `users` koleksiyonundan email bilgisi çekilir
   - Görevler kullanıcılara göre gruplanır ve gösterilir

## İndeksler

Firestore'da şu sorgular için indeks gerekebilir:

1. **Tasks sorgusu (bugünün görevleri):**
   - Field: `date`
   - Order: Ascending

2. **Tasks sorgusu (kullanıcı görevleri):**
   - Fields: `userId`, `date`
   - Order: `userId` (Ascending), `date` (Ascending)

Firebase Console'da bu sorguları çalıştırdığınızda otomatik olarak indeks oluşturma önerisi çıkacaktır.

