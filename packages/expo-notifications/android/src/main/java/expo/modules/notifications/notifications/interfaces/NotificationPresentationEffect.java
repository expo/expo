package expo.modules.notifications.notifications.interfaces;

import android.app.Notification;

import androidx.annotation.Nullable;

public interface NotificationPresentationEffect {
  boolean onNotificationPresented(@Nullable String tag, int id, Notification notification);

  boolean onNotificationPresentationFailed(@Nullable String tag, int id, Notification notification);
}
