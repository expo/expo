package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_BODY;

public class BodyModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (notification.containsKey(NOTIFICATION_BODY)) {
      builder.setContentText((String) notification.get(NOTIFICATION_BODY));
      builder.setStyle(new NotificationCompat.BigTextStyle().
          bigText((String) notification.get(NOTIFICATION_BODY)));
    }
  }
}
