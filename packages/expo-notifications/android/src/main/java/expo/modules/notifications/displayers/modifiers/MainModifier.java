package expo.modules.notifications.displayers.modifiers;

import android.content.Context;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_BODY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_COLOR;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_STICKY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_TITLE;

public class MainModifier implements  NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (!notification.containsKey(NOTIFICATION_APP_ID_KEY)) {
      notification.putString(NOTIFICATION_APP_ID_KEY, appId);
    }

    if (notification.containsKey(NOTIFICATION_TITLE)) {
      builder.setContentTitle(notification.getString(NOTIFICATION_TITLE));
    }

    if (notification.containsKey(NOTIFICATION_COLOR) && notification.getString(NOTIFICATION_COLOR) != null) {
      builder.setColor(notification.getInt(NOTIFICATION_COLOR));
    }

    if (notification.containsKey(NOTIFICATION_BODY)) {
      builder.setContentText((String) notification.get(NOTIFICATION_BODY));
      builder.setStyle(new NotificationCompat.BigTextStyle().
              bigText((String) notification.get(NOTIFICATION_BODY)));
    }

    if (!notification.getBoolean(NOTIFICATION_STICKY)) {
      builder.setAutoCancel(true);
    } else {
      builder.setAutoCancel(false);
      builder.setOngoing(true);
    }
  }
}
