package expo.modules.notifications.notifications.channels.serializers

import android.app.NotificationChannelGroup
import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi

interface NotificationsChannelGroupSerializer {
  @RequiresApi(api = Build.VERSION_CODES.O)
  fun toBundle(group: NotificationChannelGroup): Bundle

  companion object {
    const val ID_KEY = "id"
    const val NAME_KEY = "name"
    const val DESCRIPTION_KEY = "description"
    const val IS_BLOCKED_KEY = "isBlocked"
    const val CHANNELS_KEY = "channels"
  }
}
