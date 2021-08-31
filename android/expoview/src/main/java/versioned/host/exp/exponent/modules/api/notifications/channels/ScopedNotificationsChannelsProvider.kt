package versioned.host.exp.exponent.modules.api.notifications.channels

import android.content.Context
import expo.modules.notifications.notifications.channels.AbstractNotificationsChannelsProvider
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer
import host.exp.exponent.kernel.ExperienceKey

class ScopedNotificationsChannelsProvider(
  context: Context,
  private val experienceKey: ExperienceKey
) : AbstractNotificationsChannelsProvider(context) {
  override fun createChannelManager(): NotificationsChannelManager {
    return ScopedNotificationsChannelManager(mContext, experienceKey, groupManager)
  }

  override fun createChannelGroupManager(): NotificationsChannelGroupManager {
    return ScopedNotificationsGroupManager(mContext, experienceKey)
  }

  override fun createChannelSerializer(): NotificationsChannelSerializer {
    return ScopedChannelSerializer()
  }

  override fun createChannelGroupSerializer(): NotificationsChannelGroupSerializer {
    return ScopedGroupSerializer(channelSerializer)
  }
}
