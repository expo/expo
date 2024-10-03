package expo.modules.notifications.notifications.interfaces

import android.content.Context
import android.graphics.Bitmap
import android.os.Parcelable
import expo.modules.notifications.notifications.enums.NotificationPriority
import org.json.JSONObject

/**
 * This interface is implemented by classes representing notification content.
 * I.e. local notifications [NotificationContent] and remote notifications [RemoteNotificationContent].
 *
 * The reason the two classes exist is that one is persisted locally in SharedPreferences, and the other is not.
 * The first is therefore a bit "fragile" and harder to refactor, while the second is easier to change.
 * This interface exists to provide a common API for both classes.
 * */
interface INotificationContent : Parcelable {
  val title: String?
  val text: String?
  val subText: String?
  val badgeCount: Number?
  val shouldPlayDefaultSound: Boolean

  // soundName is better off as a string (was an Uri) because in RemoteNotification we can obtain the sound name
  // in local notification we store the uri and derive the sound name from it
  val soundName: String?
  val shouldUseDefaultVibrationPattern: Boolean
  val vibrationPattern: LongArray?
  val body: JSONObject?
  val priority: NotificationPriority?
  val color: Number?
  val isAutoDismiss: Boolean
  val categoryId: String?
  val isSticky: Boolean

  fun containsImage(): Boolean
  suspend fun getImage(context: Context): Bitmap?
}
