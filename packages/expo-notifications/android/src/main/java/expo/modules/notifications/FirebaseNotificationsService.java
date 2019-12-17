package expo.modules.notifications;

import com.google.firebase.messaging.FirebaseMessagingService;

import androidx.annotation.NonNull;

public class FirebaseNotificationsService extends FirebaseMessagingService {
  @Override
  public void onCreate() {
    super.onCreate();
  }

  @Override
  public void onNewToken(@NonNull String token) {
    super.onNewToken(token);
    PushTokenListener listener = PushTokenManager.CALLBACK.get();
    if (listener != null) {
      listener.onNewToken(token);
    }
  }
}
