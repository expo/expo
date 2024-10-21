package expo.modules.notifications.notifications.model

import android.content.Context
import android.graphics.Bitmap
import android.os.Parcel
import android.os.Parcelable
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.presentation.builders.downloadImage

/**
 * A POJO representing a remote notification content: title, message, body, etc.
 * The content originates in a RemoteMessage object.
 *
 * Instances of this class are not persisted in SharedPreferences (unlike {@link NotificationContent}. This class does
 * not implement Serializable, but Parcelable ensures we can pass instances between different parts of the application.
 */
class RemoteNotificationContent(private val remoteMessage: RemoteMessage) : INotificationContent {

  constructor(parcel: Parcel) : this(parcel.readParcelable<RemoteMessage>(RemoteMessage::class.java.classLoader)!!)

  private val notificationData = NotificationData(remoteMessage.data)

  override suspend fun getImage(context: Context): Bitmap? {
    val uri = remoteMessage.notification?.imageUrl
    return uri?.let { downloadImage(it) }
  }

  override fun containsImage(): Boolean {
    return remoteMessage.notification?.imageUrl != null
  }

  override val title = remoteMessage.notification?.title ?: notificationData.title

  override val text = remoteMessage.notification?.body ?: notificationData.message

  override val shouldPlayDefaultSound = remoteMessage.notification?.sound == null && notificationData.shouldPlayDefaultSound

  override val soundName = remoteMessage.notification?.sound ?: notificationData.sound

  override val shouldUseDefaultVibrationPattern: Boolean
    get() = remoteMessage.notification?.defaultVibrateSettings ?: notificationData.shouldUseDefaultVibrationPattern

  override val vibrationPattern = remoteMessage.notification?.vibrateTimings ?: notificationData.vibrationPattern

  override val body = notificationData.body

  override val priority: NotificationPriority
    get() = when (remoteMessage.priority) {
      RemoteMessage.PRIORITY_HIGH -> NotificationPriority.HIGH
      else -> NotificationPriority.DEFAULT
    }

  override val color: Number?
    get() {
      val colorSource = remoteMessage.notification?.color ?: notificationData.color
      return colorSource?.let { android.graphics.Color.parseColor(it) }
    }

  // NOTE the following getter functions are here because the local notification content class has them
  // and this class conforms to the same interface.
  // They are not supported by FCM but were previously implemented by JSONNotificationContentBuilder.java.
  override val isAutoDismiss = notificationData.autoDismiss

  override val categoryId = notificationData.categoryId

  override val isSticky = notificationData.isSticky

  override val subtitle: String? = notificationData.subText

  override val badgeCount = notificationData.badge

  override fun describeContents(): Int = 0

  override fun writeToParcel(dest: Parcel, flags: Int) {
    dest.writeParcelable(remoteMessage, flags)
  }

  companion object CREATOR : Parcelable.Creator<RemoteNotificationContent> {
    override fun createFromParcel(parcel: Parcel): RemoteNotificationContent {
      return RemoteNotificationContent(parcel)
    }

    override fun newArray(size: Int): Array<RemoteNotificationContent?> {
      return arrayOfNulls(size)
    }
  }
}
