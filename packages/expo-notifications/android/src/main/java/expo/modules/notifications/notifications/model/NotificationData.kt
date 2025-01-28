package expo.modules.notifications.notifications.model

import org.json.JSONArray
import org.json.JSONObject

/*
* In some scenarios, data-only push notifications are, in fact, presented.
* The presentation preferences are taken from the data payload.
*
* https://docs.expo.dev/versions/latest/sdk/notifications/#android-push-notification-payload-specification
* */
@JvmInline
value class NotificationData(private val data: Map<String, String>) {
  val title: String?
    get() = data["title"]

  val message: String?
    get() = data["message"]

  val body: JSONObject?
    get() = try {
      data["body"]?.let { JSONObject(it) }
    } catch (e: Exception) {
      null
    }

  val sound: String?
    get() = data["sound"]

  val shouldPlayDefaultSound: Boolean
    get() = sound == null

  val shouldUseDefaultVibrationPattern: Boolean
    get() = data["vibrate"]?.toBoolean() == true

  val isSticky: Boolean
    get() = data["sticky"]?.toBoolean() ?: false

  val vibrationPattern: LongArray?
    get() = try {
      data["vibrate"]?.let { vibrateString ->
        JSONArray(vibrateString).let { jsonArray ->
          LongArray(jsonArray.length()) { i ->
            jsonArray.getLong(i)
          }
        }
      }
    } catch (e: Exception) {
      // most likely a boolean value that cannot be converted to a longArray
      null
    }

  val color: String? get() = data["color"]

  val autoDismiss: Boolean
    get() = data["autoDismiss"]?.toBoolean() ?: true

  val categoryId: String?
    get() = data["categoryId"]

  val sticky: Boolean
    get() = data["sticky"]?.toBoolean() ?: false

  val subText: String?
    get() = data["subtitle"]

  val badge: Int?
    get() = data["badge"]?.toIntOrNull()
}
