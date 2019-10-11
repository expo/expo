package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;

import expo.modules.notifications.helpers.Utils;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_SOUND;

public class SoundModifer implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if (Utils.isAndroidVersionBelowOreo() && notification.getBoolean(NOTIFICATION_SOUND)) {
      builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
    }
  }
}
