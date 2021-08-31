package versioned.host.exp.exponent.modules.api.notifications.channels

import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils.getScopedChannelId
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils.checkIfChannelBelongsToExperience
import android.app.NotificationChannel
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.core.arguments.ReadableArguments
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager
import host.exp.exponent.kernel.ExperienceKey

class ScopedNotificationsChannelManager(
  context: Context,
  private val experienceKey: ExperienceKey,
  groupManager: NotificationsChannelGroupManager?
) : AndroidXNotificationsChannelManager(context, groupManager) {
  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getNotificationChannel(channelId: String): NotificationChannel? {
    val scopedChannel = super.getNotificationChannel(getScopedChannelId(experienceKey, channelId))
    return scopedChannel ?: super.getNotificationChannel(channelId)

    // In SDK 38 channels weren't scoped, so we want to return unscoped channel if the scoped one wasn't found.
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getNotificationChannels(): List<NotificationChannel> {
    val result = mutableListOf<NotificationChannel>()
    val notificationChannels = super.getNotificationChannels()
    for (channel in notificationChannels) {
      if (checkIfChannelBelongsToExperience(experienceKey, channel)) {
        result.add(channel)
      }
    }
    return result
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun deleteNotificationChannel(channelId: String) {
    val channelToRemove = getNotificationChannel(channelId)
    if (channelToRemove != null) {
      super.deleteNotificationChannel(channelToRemove.id)
    }
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun createNotificationChannel(
    channelId: String,
    name: CharSequence,
    importance: Int,
    channelOptions: ReadableArguments
  ): NotificationChannel {
    return super.createNotificationChannel(
      getScopedChannelId(experienceKey, channelId),
      name,
      importance,
      channelOptions
    )
  }
}
