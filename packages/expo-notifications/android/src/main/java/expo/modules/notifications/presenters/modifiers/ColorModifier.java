package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_COLOR;

public class ColorModifier implements NotificationModifier {

  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (notification.containsKey(NOTIFICATION_COLOR) && notification.getString(NOTIFICATION_COLOR) != null) {
      builder.setColor(notification.getInt(NOTIFICATION_COLOR));
    }
  }
}
