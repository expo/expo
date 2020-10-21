package expo.modules.notifications.service.delegates

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import expo.modules.notifications.notifications.model.NotificationRequest
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InvalidClassException
import java.io.ObjectInputStream
import java.io.ObjectOutputStream

/**
 * A fairly straightforward [SharedPreferences] wrapper to be used by [NotificationSchedulingHelper].
 * Saves and reads notifications (identifiers, requests and triggers) to and from the persistent storage.
 *
 *
 * A notification request of identifier = 123abc, it will be persisted under key:
 * [SharedPreferencesNotificationsStore.NOTIFICATION_REQUEST_KEY_PREFIX]123abc
 */
class SharedPreferencesNotificationsStore(context: Context) {
  companion object {
    private const val SHARED_PREFERENCES_NAME = "expo.modules.notifications.SharedPreferencesNotificationsStore"
    private const val NOTIFICATION_REQUEST_KEY_PREFIX = "notification_request-"
  }

  private val sharedPreferences: SharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)

  /**
   * Fetches scheduled notification info for given identifier.
   *
   * @param identifier Identifier of the notification.
   * @return Notification information: request and trigger.
   * @throws JSONException          Thrown if notification request could not have been interpreted as a JSON object.
   * @throws IOException            Thrown if there is an error when fetching trigger from the storage.
   * @throws ClassNotFoundException Thrown if there is an error when interpreting trigger fetched from the storage.
   */
  @Throws(IOException::class, ClassNotFoundException::class)
  fun getNotificationRequest(identifier: String) =
    deserializeNotificationRequest(
      sharedPreferences.getString(
        preferencesNotificationRequestKey(identifier),
        null
      )
    )

  /**
   * Fetches all scheduled notifications, ignoring invalid ones.
   *
   *
   * Goes through all the [SharedPreferences] entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and notification info as values
   */
  val allNotificationRequests: Collection<NotificationRequest>
    get() =
      sharedPreferences.all.mapNotNull { (key, value) ->
        try {
          if (key.startsWith(NOTIFICATION_REQUEST_KEY_PREFIX)) {
            return@mapNotNull deserializeNotificationRequest(value as String?)
          }
        } catch (e: ClassNotFoundException) {
          // do nothing
        } catch (e: IOException) {
          // do nothing
        }
        null
      }

  /**
   * Saves given notification in the persistent storage.
   *
   * @param notificationRequest Notification request
   * @throws IOException Thrown if there is an error while serializing trigger
   */
  @Throws(IOException::class)
  fun saveNotificationRequest(notificationRequest: NotificationRequest) =
    sharedPreferences.edit()
      .putString(
        preferencesNotificationRequestKey(notificationRequest.identifier),
        serializeNotificationRequest(notificationRequest)
      )
      .apply()


  /**
   * Removes notification info for given identifier.
   *
   * @param identifier Notification identifier
   */
  fun removeNotificationRequest(identifier: String) =
    removeNotificationRequest(sharedPreferences.edit(), identifier).apply()

  /**
   * Perform notification removal on provided [SharedPreferences.Editor] instance. Can be reused
   * to batch deletion.
   *
   * @param editor     Editor to apply changes onto
   * @param identifier Notification identifier
   * @return Returns a reference to the same Editor object, so you can
   * chain put calls together.
   */
  private fun removeNotificationRequest(editor: SharedPreferences.Editor, identifier: String) =
    editor.remove(preferencesNotificationRequestKey(identifier))

  /**
   * Removes all notification infos, returning removed IDs.
   */
  fun removeAllNotificationRequests(): Collection<String> =
    with(sharedPreferences.edit()) {
      allNotificationRequests.map {
        removeNotificationRequest(this, it.identifier)
        it.identifier
      }.let {
        this.apply()
        it
      }
    }

  /**
   * Serializes the trigger to a Base64-encoded string.
   *
   * @param notificationRequest Notification request to serialize
   * @return Base64-encoded, serialized trigger
   * @throws IOException Thrown if there is an error while writing trigger to string.
   */
  @Throws(IOException::class)
  private fun serializeNotificationRequest(notificationRequest: NotificationRequest) =
    ByteArrayOutputStream().use { byteArrayOutputStream ->
      ObjectOutputStream(byteArrayOutputStream).use { objectOutputStream ->
        objectOutputStream.writeObject(notificationRequest)
        Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP)
      }
    }

  /**
   * Deserializes trigger from the string representation.
   *
   * @param trigger Base64-encoded, serialized trigger representation
   * @return Deserialized trigger
   * @throws IOException            Thrown if there is an error while reading trigger from String
   * @throws ClassNotFoundException Thrown if the deserialization failes due to class not being found.
   * @throws InvalidClassException  Thrown if the trigger is of invalid class.
   */
  @Throws(IOException::class, ClassNotFoundException::class, InvalidClassException::class)
  private fun deserializeNotificationRequest(trigger: String?): NotificationRequest =
    Base64.decode(trigger, Base64.NO_WRAP).let {
      ByteArrayInputStream(it).use { byteArrayInputStream ->
        ObjectInputStream(byteArrayInputStream).use { ois ->
          val o = ois.readObject()
          if (o is NotificationRequest) {
            return o
          }
          throw InvalidClassException("Expected serialized notification request to be an instance of NotificationRequest. Found: $o")
        }
      }
    }

  /**
   * @param identifier Notification identifier
   * @return Key under which notification request will be persisted in the storage.
   */
  private fun preferencesNotificationRequestKey(identifier: String) =
    NOTIFICATION_REQUEST_KEY_PREFIX + identifier
}
