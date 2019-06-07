package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;

public class AppIdModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (!notification.containsKey(NOTIFICATION_APP_ID_KEY)) {
      notification.putString(NOTIFICATION_APP_ID_KEY, appId);
    }
  }
}
