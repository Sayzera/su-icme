const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Görev tamamlandığında tüm kullanıcılara push notification gönder
 * Firestore trigger: tasks collection'ında değişiklik olduğunda tetiklenir
 */
exports.sendTaskCompletedNotification = functions.firestore
  .document("tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Sadece completed false -> true olduğunda bildirim gönder
    if (before.completed === true || after.completed !== true) {
      console.log("Görev tamamlanmadı, bildirim gönderilmedi");
      return null;
    }

    const taskUserId = after.userId;
    const timeRangeId = after.timeRangeId;

    // Zaman aralığı etiketlerini tanımla
    const timeRangeLabels = {
      1: "09:00 - 11:00",
      2: "11:00 - 14:00",
      3: "14:00 - 16:00",
      4: "16:00 - 18:00",
    };

    const timeRangeLabel = timeRangeLabels[timeRangeId] || "Görev";

    try {
      // Görev sahibinin email'ini al
      const taskUserDoc = await db.collection("users").doc(taskUserId).get();
      const taskUserEmail = taskUserDoc.exists
        ? taskUserDoc.data().email || "Bilinmeyen Kullanıcı"
        : "Bilinmeyen Kullanıcı";

      // Tüm kullanıcıları al (görev sahibi hariç)
      const usersSnapshot = await db.collection("users").get();

      const tokens = [];

      usersSnapshot.forEach((doc) => {
        // Görevi tamamlayan kullanıcıya bildirim gönderme
        if (doc.id === taskUserId) return;

        const userData = doc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      });

      if (tokens.length === 0) {
        console.log("Bildirim gönderilecek token bulunamadı");
        return null;
      }

      // Bildirim mesajını hazırla
      const message = {
        notification: {
          title: "💧 Yeni Görev Tamamlandı!",
          body: `${taskUserEmail} ${timeRangeLabel} görevini tamamladı!`,
        },
        data: {
          type: "task_completed",
          taskId: context.params.taskId,
          userId: taskUserId,
          timeRangeId: String(timeRangeId),
        },
        tokens: tokens,
      };

      // Bildirimi gönder
      const response = await messaging.sendEachForMulticast(message);

      console.log(`${response.successCount} bildirim başarıyla gönderildi`);
      console.log(`${response.failureCount} bildirim gönderilemedi`);

      // Başarısız token'ları temizle
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.log(`Hata: ${resp.error?.message}`);
          }
        });

        // Başarısız token'ları Firestore'dan kaldır (opsiyonel)
        // Bu işlemi ayrı bir fonksiyonda yapabilirsiniz
      }

      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error("Bildirim gönderilirken hata:", error);
      return { success: false, error: error.message };
    }
  });

/**
 * Yeni görev oluşturulduğunda da bildirim gönder
 */
exports.sendNewTaskNotification = functions.firestore
  .document("tasks/{taskId}")
  .onCreate(async (snap, context) => {
    const task = snap.data();

    // Sadece tamamlanmış görev oluşturulduğunda
    if (!task.completed) {
      return null;
    }

    const taskUserId = task.userId;
    const timeRangeId = task.timeRangeId;

    const timeRangeLabels = {
      1: "09:00 - 11:00",
      2: "11:00 - 14:00",
      3: "14:00 - 16:00",
      4: "16:00 - 18:00",
    };

    const timeRangeLabel = timeRangeLabels[timeRangeId] || "Görev";

    try {
      // Görev sahibinin email'ini al
      const taskUserDoc = await db.collection("users").doc(taskUserId).get();
      const taskUserEmail = taskUserDoc.exists
        ? taskUserDoc.data().email || "Bilinmeyen Kullanıcı"
        : "Bilinmeyen Kullanıcı";

      // Tüm kullanıcıları al (görev sahibi hariç)
      const usersSnapshot = await db.collection("users").get();

      const tokens = [];

      usersSnapshot.forEach((doc) => {
        if (doc.id === taskUserId) return;

        const userData = doc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      });

      if (tokens.length === 0) {
        console.log("Bildirim gönderilecek token bulunamadı");
        return null;
      }

      const message = {
        notification: {
          title: "💧 Yeni Görev Tamamlandı!",
          body: `${taskUserEmail} ${timeRangeLabel} görevini tamamladı!`,
        },
        data: {
          type: "task_completed",
          taskId: context.params.taskId,
          userId: taskUserId,
          timeRangeId: String(timeRangeId),
        },
        tokens: tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(`${response.successCount} bildirim başarıyla gönderildi`);

      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error("Bildirim gönderilirken hata:", error);
      return { success: false, error: error.message };
    }
  });

