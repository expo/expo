package versioned.host.exp.exponent.modules.api.notifications.channels

import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils.getScopedGroupId
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils.checkIfGroupBelongsToExperience
import android.app.NotificationChannelGroup
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.core.arguments.ReadableArguments
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager
import host.exp.exponent.kernel.ExperienceKey

class ScopedNotificationsGroupManager(
  context: Context,
  private val experienceKey: ExperienceKey
) : AndroidXNotificationsChannelGroupManager(context) {
  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getNotificationChannelGroup(channelGroupId: String): NotificationChannelGroup? {
    val scopedGroup = super.getNotificationChannelGroup(getScopedGroupId(experienceKey, channelGroupId))
    return scopedGroup ?: super.getNotificationChannelGroup(channelGroupId)

    // In SDK 38 groups weren't scoped, so we want to return unscoped channel if the scoped one wasn't found.
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun getNotificationChannelGroups(): List<NotificationChannelGroup> {
    val result = mutableListOf<NotificationChannelGroup>()
    val channelGroups = super.getNotificationChannelGroups()
    for (group in channelGroups) {
      if (checkIfGroupBelongsToExperience(experienceKey, group)) {
        result.add(group)
      }
    }
    return result
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun createNotificationChannelGroup(
    groupId: String,
    name: CharSequence,
    groupOptions: ReadableArguments
  ): NotificationChannelGroup {
    return super.createNotificationChannelGroup(
      getScopedGroupId(experienceKey, groupId),
      name,
      groupOptions
    )
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  override fun deleteNotificationChannelGroup(groupId: String) {
    val groupToRemove = getNotificationChannelGroup(groupId)
    if (groupToRemove != null) {
      super.deleteNotificationChannelGroup(groupToRemove.id)
    }
  }
}
