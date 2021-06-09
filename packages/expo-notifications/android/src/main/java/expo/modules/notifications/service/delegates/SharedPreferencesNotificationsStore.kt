package expo.modules.notifications.service.delegates

import android.content.Context
import android.content.SharedPreferences
import expo.modules.notifications.notifications.model.NotificationRequest
import java.io.IOException

/**
 * A fairly straightforward [SharedPreferences] wrapper to be used by [NotificationSchedulingHelper].
 * Saves and reads notifications (identifiers, requests and triggers) to and from the persistent storage.
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
   * @throws JSONException Thrown if notification request could not have been interpreted as a JSON object.
   * @throws IOException Thrown if there is an error when fetching trigger from the storage.
   * @throws ClassNotFoundException Thrown if there is an error when interpreting trigger fetched from the storage.
   */
  @Throws(IOException::class, ClassNotFoundException::class)
  fun getNotificationRequest(identifier: String) =
    sharedPreferences.getString(
      preferencesNotificationRequestKey(identifier),
      null
    )?.asBase64EncodedObject<NotificationRequest>()

  /**
   * Fetches all scheduled notifications, ignoring invalid ones.
   *
   * Goes through all the [SharedPreferences] entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and notification info as values
   */
  val allNotificationRequests: Collection<NotificationRequest>
    get() =
      sharedPreferences
        .all
        .filter { it.key.startsWith(NOTIFICATION_REQUEST_KEY_PREFIX) }
        .mapNotNull { (_, value) ->
          return@mapNotNull try {
            (value as String?)?.asBase64EncodedObject<NotificationRequest>()
          } catch (e: ClassNotFoundException) {
            // do nothing
            null
          } catch (e: IOException) {
            // do nothing
            null
          }
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
        notificationRequest.encodedInBase64()
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
   * @param editor Editor to apply changes onto
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
   * @param identifier Notification identifier
   * @return Key under which notification request will be persisted in the storage.
   */
  private fun preferencesNotificationRequestKey(identifier: String) =
    NOTIFICATION_REQUEST_KEY_PREFIX + identifier
}
