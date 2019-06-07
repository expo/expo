package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_VIBRATE;

public class VibrateModifier implements  NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (notification.containsKey(NOTIFICATION_VIBRATE) && notification.getLongArray(NOTIFICATION_VIBRATE) != null) {
      builder.setVibrate(notification.getLongArray(NOTIFICATION_VIBRATE));
      notification.remove(NOTIFICATION_VIBRATE); // we cannot send array of longs to js by event emitter :(
    }
  }
}
