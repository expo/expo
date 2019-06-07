package expo.modules.notifications.push.fcm;

import android.app.IntentService;
import android.content.Intent;
import android.support.annotation.Nullable;

import java.util.concurrent.Semaphore;

import expo.modules.notifications.push.TokenDispatcher.ThreadSafeTokenDispatcher;

public class ExpoIntentService extends IntentService {

  protected ExpoIntentService() {
    super("ExpoIntentService");
  }

  @Override
  protected void onHandleIntent(@Nullable Intent intent) {
    String newToken = intent.getStringExtra("token");
    Semaphore semaphore = new Semaphore(1);
    try {
      semaphore.acquire();
      ThreadSafeTokenDispatcher.getInstance(getApplicationContext()).onNewToken(newToken, ()-> {
        semaphore.release();
      });
      semaphore.acquire();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }
  }
}
