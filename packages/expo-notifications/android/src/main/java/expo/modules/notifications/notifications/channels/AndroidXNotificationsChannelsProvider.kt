package expo.modules.notifications.notifications.channels

import android.content.Context
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer

class AndroidXNotificationsChannelsProvider(context: Context) : AbstractNotificationsChannelsProvider(context) {

  override val groupManager by lazy {
    AndroidXNotificationsChannelGroupManager(context)
  }

  override val channelManager by lazy {
    AndroidXNotificationsChannelManager(context, groupManager)
  }

  override val channelSerializer by lazy {
    ExpoNotificationsChannelSerializer()
  }

  override val groupSerializer by lazy {
    ExpoNotificationsChannelGroupSerializer(channelSerializer)
  }
}
