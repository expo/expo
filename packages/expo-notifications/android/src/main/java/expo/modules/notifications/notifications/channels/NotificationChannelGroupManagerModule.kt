package expo.modules.notifications.notifications.channels

import android.content.Context
import android.os.Build
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer

/**
 * An exported module responsible for exposing methods for managing notification channel groups.
 */
class NotificationChannelGroupManagerModule(context: Context) : ExportedModule(context) {
  private lateinit var groupManager: NotificationsChannelGroupManager
  private lateinit var groupSerializer: NotificationsChannelGroupSerializer

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    val provider = moduleRegistry.getModule(NotificationsChannelsProvider::class.java)
    groupManager = provider.groupManager
    groupSerializer = provider.groupSerializer
  }

  override fun getName(): String = "ExpoNotificationChannelGroupManager"

  @ExpoMethod
  fun getNotificationChannelGroupAsync(groupId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    val group = groupManager.getNotificationChannelGroup(groupId)
    promise.resolve(groupSerializer.toBundle(group))
  }

  @ExpoMethod
  fun getNotificationChannelGroupsAsync(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    val serializedChannels = groupManager
      .notificationChannelGroups
      .map(groupSerializer::toBundle)
    promise.resolve(serializedChannels)
  }

  @ExpoMethod
  fun setNotificationChannelGroupAsync(groupId: String, groupOptions: ReadableArguments, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    val group = groupManager.createNotificationChannelGroup(
      groupId,
      getNameFromOptions(groupOptions),
      groupOptions
    )
    promise.resolve(groupSerializer.toBundle(group))
  }

  @ExpoMethod
  fun deleteNotificationChannelGroupAsync(groupId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    groupManager.deleteNotificationChannelGroup(groupId)
    promise.resolve(null)
  }

  private fun getNameFromOptions(groupOptions: ReadableArguments): String {
    return groupOptions.getString(NotificationsChannelGroupSerializer.NAME_KEY)
  }
}
