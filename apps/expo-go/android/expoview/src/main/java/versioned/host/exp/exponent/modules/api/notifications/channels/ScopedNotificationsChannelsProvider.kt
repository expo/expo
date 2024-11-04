package versioned.host.exp.exponent.modules.api.notifications.channels

import android.content.Context
import expo.modules.notifications.notifications.channels.AbstractNotificationsChannelsProvider
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer
import host.exp.exponent.kernel.ExperienceKey

class ScopedNotificationsChannelsProvider(
    context: Context?,
    private val mExperienceKey: ExperienceKey,
) : AbstractNotificationsChannelsProvider(context) {
    override val channelManager get() = ScopedNotificationsChannelManager(mContext, mExperienceKey, groupManager)

    override val groupManager: NotificationsChannelGroupManager
        get() = ScopedNotificationsGroupManager(mContext, mExperienceKey)

    override val groupSerializer: NotificationsChannelGroupSerializer
        get() = ScopedGroupSerializer(channelSerializer)

    override val channelSerializer: NotificationsChannelSerializer
        get() = ScopedChannelSerializer()
}
