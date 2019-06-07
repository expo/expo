package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import expo.modules.notifications.helpers.Utils;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_PRIORITY;

public class ImportanceModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (notification.containsKey(NOTIFICATION_PRIORITY) && Utils.isAndroidVersionBelowOreo()) {
      int priority = notification.getInt(NOTIFICATION_PRIORITY);
      // priority should be a number from {-2, -1, 0, 1, 2}
      builder.setPriority(priority);
    }
  }
}
