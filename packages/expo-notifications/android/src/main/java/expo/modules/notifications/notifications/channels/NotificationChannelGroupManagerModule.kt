package expo.modules.notifications.notifications.channels

import android.os.Build
import android.os.Bundle
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer

/**
 * An exported module responsible for exposing methods for managing notification channel groups.
 */
open class NotificationChannelGroupManagerModule : Module(), NotificationsChannelProviderAccessor {
  private val groupManager by lazy {
    getChannelProvider(appContext.registry).groupManager
  }
  private val groupSerializer by lazy {
    getChannelProvider(appContext.registry).groupSerializer
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationChannelGroupManager")

    AsyncFunction("getNotificationChannelGroupAsync") { groupId: String ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val group = groupManager.getNotificationChannelGroup(groupId)
        groupSerializer.toBundle(group)
      } else {
        null
      }
    }

    AsyncFunction<List<Bundle?>?>("getNotificationChannelGroupsAsync") {
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
