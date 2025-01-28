package expo.modules.notifications.notifications.presentation.builders

import android.app.Notification
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import android.os.Parcel
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.RemoteInput
import expo.modules.notifications.notifications.SoundResolver
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.createNotificationResponseIntent
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import java.io.IOException
import kotlin.math.max
import kotlin.math.min

/**
 * [NotificationBuilder] interpreting a JSON request object.
 */
open class ExpoNotificationBuilder(
  context: Context,
  notification: expo.modules.notifications.notifications.model.Notification,
  private val store: SharedPreferencesNotificationCategoriesStore
) : BaseNotificationBuilder(context, notification) {

  open fun addActionsToBuilder(
    builder: NotificationCompat.Builder,
    categoryIdentifier: String
  ) {
    var actions = emptyList<NotificationAction>()
    try {
      val category: NotificationCategory? = store.getNotificationCategory(categoryIdentifier)
      if (category != null) {
        actions = category.actions
      }
    } catch (e: ClassNotFoundException) {
      Log.e(
        "expo-notifications",
        String.format(
          "Could not read category with identifier: %s. %s",
          categoryIdentifier,
          e.message
        )
      )
    } catch (e: IOException) {
      Log.e(
        "expo-notifications",
        String.format(
          "Could not read category with identifier: %s. %s",
          categoryIdentifier,
          e.message
        )
      )
    }
    for (action in actions) {
      if (action is TextInputNotificationAction) {
        builder.addAction(buildTextInputAction(action))
      } else {
        builder.addAction(buildButtonAction(action))
      }
    }
  }

  protected fun buildButtonAction(action: NotificationAction): NotificationCompat.Action {
    val intent = createNotificationResponseIntent(context, notification, action)
    return NotificationCompat.Action.Builder(icon, action.title, intent).build()
  }

  protected fun buildTextInputAction(action: TextInputNotificationAction): NotificationCompat.Action {
    val intent = createNotificationResponseIntent(context, notification, action)
    val remoteInput = RemoteInput.Builder(NotificationsService.USER_TEXT_RESPONSE_KEY)
      .setLabel(action.placeholder)
      .build()

    return NotificationCompat.Action.Builder(icon, action.title, intent)
      .addRemoteInput(remoteInput).build()
  }

  override suspend fun build(): Notification {
    val builder = createBuilder()

    builder.setSmallIcon(icon)
    builder.setPriority(priority)

    val content = notificationContent

    builder.setAutoCancel(content.isAutoDismiss)
    builder.setOngoing(content.isSticky)

    // see "Notification anatomy" https://developer.android.com/develop/ui/views/notifications#Templates
    builder.setContentTitle(content.title)
    builder.setContentText(content.text)
    builder.setSubText(content.subText)
    // Sets the text/contentText as the bigText to allow the notification to be expanded and the
    // entire text to be viewed.
    builder.setStyle(NotificationCompat.BigTextStyle().bigText(content.text))

    color?.let { builder.color = it.toInt() }
    notificationContent.badgeCount?.toInt()?.let { builder.setNumber(it) }
    notificationContent.categoryId?.let { addActionsToBuilder(builder, it) }

    applySoundsAndVibrations(content, builder)

    if (content.body != null) {
      // Add body - JSON data - to extras
      val extras = builder.extras
      extras.putString(EXTRAS_BODY_KEY, content.body.toString())
      builder.setExtras(extras)
    }

    // Save the notification request in extras for later usage
    // eg. in ExpoPresentationDelegate when we fetch active notifications.
    // Otherwise we'd have to create expo.Notification from android.Notification
    // and deal with two-way interpreting.
    val requestExtras = Bundle()
    // Class loader used in BaseBundle when unmarshalling notification extras
    // cannot handle expo.modules.notifications.….NotificationRequest
    // so we go around it by marshalling and unmarshalling the object ourselves.
    requestExtras.putByteArray(
      EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY,
      marshallNotificationRequest(
        notification.notificationRequest
      )
    )
    builder.addExtras(requestExtras)

    val defaultAction =
      NotificationAction(NotificationResponse.DEFAULT_ACTION_IDENTIFIER, null, true)
    builder.setContentIntent(
      createNotificationResponseIntent(
        context,
        notification,
        defaultAction
      )
    )

    if (notificationContent.containsImage()) {
      val bitmap = notificationContent.getImage(context)
      bitmap?.let { builder.setLargeIcon(it) }
    } else {
      builder.setLargeIcon(largeIcon)
    }
    return builder.build()
  }

  private fun applySoundsAndVibrations(content: INotificationContent, builder: NotificationCompat.Builder) {
    val shouldPlaySound = shouldPlaySound()
    val shouldVibrate = shouldVibrate()

    if (!shouldPlaySound && !shouldVibrate) {
      // Notification will not vibrate or play sound, regardless of channel
      builder.setSilent(true)
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      // the calls below are ignored on Android O and newer because the sound and vibration are set in the channel
      val shouldPlayDefaultSound = shouldPlaySound && content.shouldPlayDefaultSound
      val shouldUseDefaultVibrationPattern = shouldVibrate && content.shouldUseDefaultVibrationPattern
      if (shouldUseDefaultVibrationPattern && shouldPlayDefaultSound) {
        builder.setDefaults(NotificationCompat.DEFAULT_ALL)
      } else {
        if (shouldPlaySound) {
          if (content.soundName != null) {
            val soundUri = SoundResolver(context).resolve(content.soundName)
            builder.setSound(soundUri)
          } else if (shouldPlayDefaultSound) {
            builder.setDefaults(NotificationCompat.DEFAULT_SOUND)
            builder.setSound(Settings.System.DEFAULT_NOTIFICATION_URI)
          }
        }
        if (shouldVibrate) {
          val vibrationPatternOverride = content.vibrationPattern
          if (vibrationPatternOverride != null) {
            builder.setVibrate(vibrationPatternOverride)
          } else if (shouldUseDefaultVibrationPattern) {
            builder.setDefaults(NotificationCompat.DEFAULT_VIBRATE)
          }
        }
      }
    }
  }

  /**
   * Marshalls [NotificationRequest] into to a byte array.
   *
   * @param request Notification request to marshall
   * @return Given request marshalled to a byte array or null if the process failed.
   */
  protected fun marshallNotificationRequest(request: NotificationRequest): ByteArray? {
    try {
      val parcel = Parcel.obtain()
      request.writeToParcel(parcel, 0)
      val bytes = parcel.marshall()
      parcel.recycle()
      return bytes
    } catch (e: Exception) {
      // If we couldn't marshall the request, let's not fail the whole build process.
      // The request is only used to extract source request when fetching displayed notifications.
      Log.e(
        "expo-notifications",
        "Could not marshalled notification request: ${request.identifier}.",
        e
      )
      return null
    }
  }

  /**
   * Notification should play a sound if and only if:
   * - behavior is not set or allows sound AND
   * - notification request doesn't explicitly set "sound" to false.
   *
   *
   * This way a notification can set "sound" to false to disable sound,
   * and we always honor the allowedBehavior, if set.
   *
   * @return Whether the notification should play a sound.
   */
  private fun shouldPlaySound(): Boolean {
    val behaviorAllowsSound = notificationBehavior?.shouldPlaySound() ?: true
    val contentAllowsSound =
      notificationContent.shouldPlayDefaultSound || notificationContent.soundName != null

    return behaviorAllowsSound && contentAllowsSound
  }

  /**
   * Notification should vibrate if and only if:
   * - behavior is not set or allows sound AND
   * - notification request doesn't explicitly set "vibrate" to false.
   *
   *
   * This way a notification can set "vibrate" to false to disable vibration.
   *
   * @return Whether the notification should vibrate.
   */
  private fun shouldVibrate(): Boolean {
    val behaviorAllowsVibration = notificationBehavior?.shouldPlaySound() ?: true

    val contentAllowsVibration =
      notificationContent.shouldUseDefaultVibrationPattern || notificationContent.vibrationPattern != null

    return behaviorAllowsVibration && contentAllowsVibration
  }

  private val priority: Int
    /**
     * When setting the priority we want to honor both behavior set by the current
     * notification handler and the preset priority (in that order of significance).
     *
     *
     * We do this by returning:
     * - if behavior defines a priority: the priority,
     * - if the notification should be shown: high priority (or max, if requested in the notification),
     * - if the notification should not be shown: default priority (or lower, if requested in the notification).
     *
     *
     * This way we allow full customization to the developers.
     *
     * @return Priority of the notification, one of NotificationCompat.PRIORITY_*
     */
    get() {
      val requestPriority = notificationContent.priority

      val notificationBehavior = notificationBehavior
      // If we know of a behavior guideline, let's honor it...
      if (notificationBehavior != null) {
        // ...by using the priority override...
        val priorityOverride = notificationBehavior.priorityOverride
        if (priorityOverride != null) {
          return priorityOverride.nativeValue
        }

        // ...or by setting min/max values for priority:
        // If the notification has no priority set, let's pick a neutral value and depend solely on the behavior.
        val requestPriorityValue =
          requestPriority?.nativeValue ?: NotificationPriority.DEFAULT.nativeValue

        // TODO (barthap): This is going to be a dead code upon removing presentNotificationAsync()
        // shouldShowAlert() will always be false here.
        return if (notificationBehavior.shouldShowAlert()) {
          // Display as a heads-up notification, as per the behavior
          // while also allowing making the priority higher.
          max(
            NotificationCompat.PRIORITY_HIGH.toDouble(),
            requestPriorityValue.toDouble()
          ).toInt()
        } else {
          // Do not display as a heads-up notification, but show in the notification tray
          // as per the behavior, while also allowing making the priority lower.
          min(
            NotificationCompat.PRIORITY_DEFAULT.toDouble(),
            requestPriorityValue.toDouble()
          ).toInt()
        }
      }

      // No behavior is set, the only source of priority can be the request.
      if (requestPriority != null) {
        return requestPriority.nativeValue
      }

      // By default let's show the notification
      return NotificationCompat.PRIORITY_HIGH
    }

  protected val largeIcon: Bitmap?
    /**
     * The method first tries to get the large icon from the manifest's meta-data [.META_DATA_DEFAULT_ICON_KEY].
     * If a custom setting is not found, the method falls back to null.
     *
     * @return Bitmap containing larger icon or null if a custom settings was not provided.
     */
    get() {
      try {
        val ai = context.packageManager.getApplicationInfo(
          context.packageName,
          PackageManager.GET_META_DATA
        )
        if (ai.metaData.containsKey(META_DATA_LARGE_ICON_KEY)) {
          val resourceId = ai.metaData.getInt(META_DATA_LARGE_ICON_KEY)
          return BitmapFactory.decodeResource(context.resources, resourceId)
        }
      } catch (e: Exception) {
        Log.e("expo-notifications", "Could not have fetched large notification icon.", e)
      }
      return null
    }

  protected open val icon: Int
    /**
     * The method first tries to get the icon from the manifest's meta-data [.META_DATA_DEFAULT_ICON_KEY].
     * If a custom setting is not found, the method falls back to using app icon.
     *
     * @return Resource ID for icon that should be used as a notification icon.
     */
    get() {
      try {
        val ai = context.packageManager.getApplicationInfo(
          context.packageName,
          PackageManager.GET_META_DATA
        )
        if (ai.metaData.containsKey(META_DATA_DEFAULT_ICON_KEY)) {
          return ai.metaData.getInt(META_DATA_DEFAULT_ICON_KEY)
        }
      } catch (e: Exception) {
        Log.e("expo-notifications", "Could not have fetched default notification icon.", e)
      }
      return context.applicationInfo.icon
    }

  protected open val color: Number?
    /**
     * The method responsible for finding and returning a custom color used to color the notification icon.
     * It first tries to use a custom color defined in notification content, then it tries to fetch color
     * from resources (based on manifest's meta-data). If not found, returns null.
     *
     * @return A [Number], if a custom color should be used for notification icon
     * or null if the default should be used.
     */
    get() {
      return notificationContent.color ?: run {
        try {
          val ai = context.packageManager.getApplicationInfo(
            context.packageName,
            PackageManager.GET_META_DATA
          )
          if (ai.metaData.containsKey(META_DATA_DEFAULT_COLOR_KEY)) {
            return context.resources.getColor(
              ai.metaData.getInt(META_DATA_DEFAULT_COLOR_KEY),
              null
            )
          }
        } catch (e: Exception) {
          Log.e(
            "expo-notifications",
            "Could not have fetched default notification color.",
            e
          )
        }

        // No custom color
        return null
      }
    }

  companion object {
    const val META_DATA_DEFAULT_ICON_KEY: String =
      "expo.modules.notifications.default_notification_icon"
    const val META_DATA_LARGE_ICON_KEY: String =
      "expo.modules.notifications.large_notification_icon"
    const val META_DATA_DEFAULT_COLOR_KEY: String =
      "expo.modules.notifications.default_notification_color"
    const val EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY: String = "expo.notification_request"
    const val EXTRAS_BODY_KEY = "body"
  }
}
