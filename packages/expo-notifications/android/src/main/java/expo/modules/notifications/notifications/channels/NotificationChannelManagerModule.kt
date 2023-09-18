package expo.modules.notifications.notifications.channels

import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer
import expo.modules.notifications.notifications.enums.NotificationImportance
import java.util.Collections
import java.util.Objects

/**
 * An exported module responsible for exposing methods for managing notification channels.
 */
open class NotificationChannelManagerModule(context: Context?) : ExportedModule(context) {
  private lateinit var channelManager: NotificationsChannelManager
  private lateinit var channelSerializer: NotificationsChannelSerializer

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    val provider = moduleRegistry.getModule(NotificationsChannelsProvider::class.java)
    channelManager = provider.channelManager
    channelSerializer = provider.channelSerializer
  }

  override fun getName(): String = "ExpoNotificationChannelManager"

  @ExpoMethod
  fun getNotificationChannelAsync(channelId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    val notificationChannel = channelManager.getNotificationChannel(channelId)
    promise.resolve(channelSerializer.toBundle(notificationChannel))
  }

  @ExpoMethod
  fun getNotificationChannelsAsync(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(Collections.EMPTY_LIST)
      return
    }
    val serializedChannels = channelManager
      .notificationChannels
      .map(channelSerializer::toBundle)
    promise.resolve(serializedChannels)
  }

  @ExpoMethod
  fun setNotificationChannelAsync(channelId: String, channelOptions: ReadableArguments, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    val channel = channelManager.createNotificationChannel(
      channelId,
      getNameFromOptions(channelOptions),
      getImportanceFromOptions(channelOptions),
      channelOptions
    )
    promise.resolve(channelSerializer.toBundle(channel))
  }

  @ExpoMethod
  fun deleteNotificationChannelAsync(channelId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }
    channelManager.deleteNotificationChannel(channelId)
    promise.resolve(null)
  }

  private fun getNameFromOptions(channelOptions: ReadableArguments): CharSequence {
    return channelOptions.getString(NotificationsChannelSerializer.NAME_KEY)
  }

  @RequiresApi(api = Build.VERSION_CODES.N)
  private fun getImportanceFromOptions(channelOptions: ReadableArguments): Int {
    val enumValue = channelOptions.getInt(NotificationsChannelSerializer.IMPORTANCE_KEY, NotificationImportance.DEFAULT.enumValue)
    val importance = Objects.requireNonNull(NotificationImportance.fromEnumValue(enumValue))
    return importance.nativeValue
  }
}
