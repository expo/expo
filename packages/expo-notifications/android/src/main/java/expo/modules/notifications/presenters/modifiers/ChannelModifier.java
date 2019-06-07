package expo.modules.notifications.presenters.modifiers;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;

import java.util.concurrent.ExecutionException;

import expo.modules.notifications.NotificationConstants;
import expo.modules.notifications.channels.ChannelManager;
import expo.modules.notifications.channels.ChannelPOJO;
import expo.modules.notifications.channels.ThreadSafeChannelManager;
import expo.modules.notifications.helpers.Utils;


import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_PRIORITY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_SOUND;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_VIBRATE;

public class ChannelModifier implements NotificationModifier {
  @Override
  public void modify(NotificationCompat.Builder builder, Bundle notification, Context context, String appId) {
    if ((!notification.containsKey(NOTIFICATION_CHANNEL_ID)) || notification.getString(NOTIFICATION_CHANNEL_ID) == null) {
      notification.putString(NOTIFICATION_CHANNEL_ID, NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID);
    }

    ChannelManager channelManager = ThreadSafeChannelManager.getInstance();

    String channelId = notification.getString(NOTIFICATION_CHANNEL_ID);
    ChannelPOJO channelPOJO = null;

    try {
      channelPOJO = channelManager.getPropertiesForChannelId(channelId, context.getApplicationContext()).get();
    } catch (InterruptedException e) {
      e.printStackTrace();
    } catch (ExecutionException e) {
      e.printStackTrace();
    }

    if (!Utils.isAndroidVersionBelowOreo()) {
      if (channelPOJO != null) {
        builder.setChannelId(channelId);
      }
    } else {
      if (channelPOJO == null) {
        return;
      }

      if (!notification.containsKey(NOTIFICATION_SOUND)) {
        notification.putBoolean(
            NOTIFICATION_SOUND,
            channelPOJO.getSound()
        );
      }

      if (!notification.containsKey(NOTIFICATION_PRIORITY)) {
        int priority = channelPOJO.getImportance() - 3; // priority has slightly different range than channel importance
        notification.putInt(NOTIFICATION_PRIORITY, priority);
      }

      if (!notification.containsKey(NOTIFICATION_VIBRATE)) {
        notification.putLongArray(NOTIFICATION_VIBRATE, channelPOJO.getVibrate());
      }
    }
  }
}
