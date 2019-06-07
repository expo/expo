package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_TITLE;

public class TitleModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (notification.containsKey(NOTIFICATION_TITLE)) {
      builder.setContentTitle(notification.getString(NOTIFICATION_TITLE));
    }
  }
}
