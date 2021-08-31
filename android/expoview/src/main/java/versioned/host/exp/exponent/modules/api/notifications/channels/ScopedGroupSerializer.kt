package versioned.host.exp.exponent.modules.api.notifications.channels

import android.app.NotificationChannelGroup
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils.getUnscopedId

class ScopedGroupSerializer(channelSerializer: NotificationsChannelSerializer) :
  ExpoNotificationsChannelGroupSerializer(channelSerializer) {
  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getId(channel: NotificationChannelGroup): String? {
    return getUnscopedId(super.getId(channel))
  }
}
