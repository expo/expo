package expo.modules.notifications.notifications.model

import android.content.Context
import android.graphics.Bitmap
import android.os.Parcel
import android.os.Parcelable
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.presentation.builders.downloadImage
import org.json.JSONObject

/**
 * A POJO representing a remote notification content: title, message, body, etc.
 * The content originates in a RemoteMessage object.
 *
 * Instances of this class are not persisted in SharedPreferences (unlike {@link NotificationContent}. This class does
 * not implement Serializable, but Parcelable ensures we can pass instances between different parts of the application.
 */
class RemoteNotificationContent(private val remoteMessage: RemoteMessage) : INotificationContent {

  constructor(parcel: Parcel) : this(parcel.readParcelable<RemoteMessage>(RemoteMessage::class.java.classLoader)!!)

  override suspend fun getImage(context: Context): Bitmap? {
    val uri = remoteMessage.notification?.imageUrl
    return uri?.let { downloadImage(it) }
  }

  override fun containsImage(): Boolean {
    return remoteMessage.notification?.imageUrl != null
  }

  override val title: String?
    get() = remoteMessage.notification?.title

  override val text: String?
    get() = remoteMessage.notification?.body

  override val shouldPlayDefaultSound: Boolean
    get() = remoteMessage.notification?.sound == null

  override val soundName: String?
    get() = remoteMessage.notification?.sound

  override val shouldUseDefaultVibrationPattern: Boolean
    get() = remoteMessage.notification?.defaultVibrateSettings == true

  override val vibrationPattern: LongArray?
    get() = remoteMessage.notification?.vibrateTimings

  override val body: JSONObject?
    get() = try {
      remoteMessage.data["body"]?.let { JSONObject(it) }
    } catch (e: Exception) {
      null
    }

  override val priority: NotificationPriority
    get() = when (remoteMessage.priority) {
      RemoteMessage.PRIORITY_HIGH -> NotificationPriority.HIGH
      else -> NotificationPriority.DEFAULT
    }

  override val color: Number?
    get() = remoteMessage.notification?.color?.let { android.graphics.Color.parseColor(it) }

  // NOTE the following getter functions are here because the local notification content class has them
  // and this class conforms to the same interface. They are not supported by FCM.
  override val isAutoDismiss: Boolean
    get() = remoteMessage.data["autoDismiss"]?.toBoolean() ?: true

  override val categoryId: String?
    get() = remoteMessage.data["categoryId"]

  override val isSticky: Boolean
    get() = remoteMessage.data["sticky"]?.toBoolean() ?: false

  override val subText: String?
    get() = remoteMessage.data["subtitle"]

  override val badgeCount: Number?
    get() = remoteMessage.data["badge"]?.toIntOrNull()

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
