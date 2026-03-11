package versioned.host.exp.exponent.modules.api.notifications.channels

import android.content.Context
import expo.modules.core.interfaces.InternalModule
import expo.modules.notifications.notifications.channels.NotificationsChannelsProvider
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer
import host.exp.exponent.kernel.ExperienceKey

class ScopedNotificationsChannelsProvider(
    val mContext: Context,
    private val mExperienceKey: ExperienceKey,
) : NotificationsChannelsProvider, InternalModule {
    override val channelManager get() = ScopedNotificationsChannelManager(mContext, mExperienceKey, groupManager)

    override val groupManager: NotificationsChannelGroupManager
        get() = ScopedNotificationsGroupManager(mContext, mExperienceKey)

    override val groupSerializer: NotificationsChannelGroupSerializer
        get() = ScopedGroupSerializer(channelSerializer)

    override val channelSerializer: NotificationsChannelSerializer
        get() = ScopedChannelSerializer()

    override fun getExportedInterfaces(): List<Class<*>?> {
        // TODO vonovak refactor this for expo go
        return listOf(NotificationsChannelsProvider::class.java)
    }
}
