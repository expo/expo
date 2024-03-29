package expo.modules.notifications.notifications.channels

import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ModuleNotFoundException
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer
import expo.modules.notifications.notifications.enums.NotificationImportance
import java.util.Objects

/**
 * An exported module responsible for exposing methods for managing notification channels.
 */
open class NotificationChannelManagerModule : Module() {
  private lateinit var channelManager: NotificationsChannelManager
  private lateinit var channelSerializer: NotificationsChannelSerializer

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationChannelManager")

    OnCreate {
      val provider = appContext.legacyModule<NotificationsChannelsProvider>()
        ?: throw ModuleNotFoundException(NotificationsChannelsProvider::class)

      channelManager = provider.channelManager
      channelSerializer = provider.channelSerializer
    }

    AsyncFunction<List<Bundle?>>("getNotificationChannelsAsync") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return@AsyncFunction emptyList<Bundle>()
      }

      return@AsyncFunction channelManager
        .notificationChannels
        .map(channelSerializer::toBundle)
    }

    AsyncFunction("getNotificationChannelAsync") { channelId: String ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val notificationChannel = channelManager.getNotificationChannel(channelId)
        channelSerializer.toBundle(notificationChannel)
      } else {
        null
      }
    }

    AsyncFunction("setNotificationChannelAsync") { channelId: String, channelOptions: ReadableArguments ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = channelManager.createNotificationChannel(
          channelId,
          getNameFromOptions(channelOptions),
          getImportanceFromOptions(channelOptions),
          channelOptions
        )
        channelSerializer.toBundle(channel)
      } else {
        null
      }
    }

    AsyncFunction("deleteNotificationChannelAsync") { channelId: String ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        channelManager.deleteNotificationChannel(channelId)
      }
    }
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
