package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_STICKY;

public class StickyModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (!notification.getBoolean(NOTIFICATION_STICKY)) {
      builder.setAutoCancel(true);
    } else {
      builder.setAutoCancel(false);
      builder.setOngoing(true);
    }
  }
}
