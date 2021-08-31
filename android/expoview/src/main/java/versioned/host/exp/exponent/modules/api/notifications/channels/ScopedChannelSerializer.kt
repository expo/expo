package versioned.host.exp.exponent.modules.api.notifications.channels

import android.app.NotificationChannel
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils.getUnscopedId

class ScopedChannelSerializer : ExpoNotificationsChannelSerializer() {
  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getChannelId(channel: NotificationChannel): String? {
    return getUnscopedId(super.getChannelId(channel))
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getGroupId(channel: NotificationChannel): String? {
    return getUnscopedId(super.getGroupId(channel))
  }
}
