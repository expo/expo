package expo.modules.notifications.notifications.channels

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer

const val NotificationsChannelsProviderName = "NotificationsChannelsProvider"

class AndroidXNotificationsChannelsProvider : Module(), NotificationsChannelsProvider {

  override fun definition() = ModuleDefinition {
    Name(NotificationsChannelsProviderName)
  }

  override val groupManager by lazy {
    AndroidXNotificationsChannelGroupManager(appContext.reactContext)
  }

  override val channelManager by lazy {
    AndroidXNotificationsChannelManager(appContext.reactContext, groupManager)
  }

  override val channelSerializer by lazy {
    ExpoNotificationsChannelSerializer()
  }

  override val groupSerializer by lazy {
    ExpoNotificationsChannelGroupSerializer(channelSerializer)
  }
}
