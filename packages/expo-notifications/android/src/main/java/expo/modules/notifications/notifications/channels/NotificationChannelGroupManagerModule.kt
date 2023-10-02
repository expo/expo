package expo.modules.notifications.notifications.channels

import android.os.Build
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ModuleNotFoundException
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer

/**
 * An exported module responsible for exposing methods for managing notification channel groups.
 */
class NotificationChannelGroupManagerModule : Module() {
  private lateinit var groupManager: NotificationsChannelGroupManager
  private lateinit var groupSerializer: NotificationsChannelGroupSerializer

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationChannelGroupManager")

    OnCreate {
      val provider = appContext.legacyModule<NotificationsChannelsProvider>()
        ?: throw ModuleNotFoundException(NotificationsChannelsProvider::class)
      groupManager = provider.groupManager
      groupSerializer = provider.groupSerializer
    }

    AsyncFunction("getNotificationChannelGroupAsync") { groupId: String ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val group = groupManager.getNotificationChannelGroup(groupId)
        groupSerializer.toBundle(group)
      } else {
        null
      }
    }

    AsyncFunction("getNotificationChannelGroupsAsync") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        groupManager
          .notificationChannelGroups
          .map(groupSerializer::toBundle)
      } else {
        null
      }
    }

    AsyncFunction("setNotificationChannelGroupAsync") { groupId: String, groupOptions: ReadableArguments ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val group = groupManager.createNotificationChannelGroup(
          groupId,
          getNameFromOptions(groupOptions),
          groupOptions
        )
        groupSerializer.toBundle(group)
      } else {
        null
      }
    }

    AsyncFunction("deleteNotificationChannelGroupAsync") { groupId: String ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        groupManager.deleteNotificationChannelGroup(groupId)
      }
    }
  }

  private fun getNameFromOptions(groupOptions: ReadableArguments): String {
    return groupOptions.getString(NotificationsChannelGroupSerializer.NAME_KEY)
  }
}
