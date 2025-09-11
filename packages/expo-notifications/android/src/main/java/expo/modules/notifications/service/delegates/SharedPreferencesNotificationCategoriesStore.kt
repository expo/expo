package expo.modules.notifications.service.delegates

import android.content.Context
import android.content.SharedPreferences
import expo.modules.notifications.notifications.model.NotificationCategory
import java.io.IOException

/**
 * A fairly straightforward [SharedPreferences] wrapper to be used by [NotificationSchedulingHelper].
 * Saves and reads notification category information (identifiers, actions, and options) to and from persistent storage.
 *
 * A notification category with identifier = 123abc will be persisted under key:
 * [SharedPreferencesNotificationCategoriesStore.NOTIFICATION_CATEGORY_KEY_PREFIX]123abc
 */
class SharedPreferencesNotificationCategoriesStore(context: Context) {
  companion object {
    private const val SHARED_PREFERENCES_NAME = "expo.modules.notifications.SharedPreferencesNotificationCategoriesStore"
    private const val NOTIFICATION_CATEGORY_KEY_PREFIX = "notification_category-"
  }

  private val sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)

  /**
   * Fetches notification category info for given identifier.
   *
   * @param identifier Identifier of the category.
   * @return Category information: actions and options.
   * @throws JSONException Thrown if notification category could not be interpreted as a JSON object.
   * @throws IOException Thrown if there is an error when fetching the category from storage.
   * @throws ClassNotFoundException Thrown if there is an error when interpreting the category fetched from storage.
   */
  @Throws(IOException::class, ClassNotFoundException::class)
  fun getNotificationCategory(identifier: String) =
    sharedPreferences.getString(
      preferencesNotificationCategoryKey(identifier),
      null
    )?.asBase64EncodedObject<NotificationCategory>()

  /**
   * Fetches all categories, ignoring invalid ones.
   *
   * Goes through all the [SharedPreferences] entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and category info as values
   */
  val allNotificationCategories: Collection<NotificationCategory>
    get() =
      sharedPreferences
        .all
        .filter { it.key.startsWith(NOTIFICATION_CATEGORY_KEY_PREFIX) }
        .mapNotNull { (_, value) ->
          return@mapNotNull try {
            (value as String?)?.asBase64EncodedObject<NotificationCategory>()
          } catch (e: ClassNotFoundException) {
            // do nothing
            null
          } catch (e: IOException) {
            // do nothing
            null
          }
        }

  /**
   * Saves given category in persistent storage.
   *
   * @param notificationCategory Notification category
   * @throws IOException Thrown if there is an error while serializing the category
   * @return The category that was just created, or null if it couldn't be created.
   */
  @Throws(IOException::class)
  fun saveNotificationCategory(notificationCategory: NotificationCategory) =
    sharedPreferences
      .edit()
      .putString(
        preferencesNotificationCategoryKey(notificationCategory.identifier),
        notificationCategory.encodedInBase64()
      )
      .commit()
      .let { if (it) notificationCategory else null }

  /**
   * Removes notification category for the given identifier.
   *
   * @param identifier Category identifier
   * @return Return true if category was deleted, false if not.
   */
  fun removeNotificationCategory(identifier: String): Boolean {
    val id = preferencesNotificationCategoryKey(identifier)
    sharedPreferences.getString(
      id,
      null
    ) ?: return false

    return sharedPreferences
      .edit()
      .remove(id)
      .commit()
  }

  /**
   * @param identifier Category identifier
   * @return Key under which the notification category will be persisted in storage.
   */
  private fun preferencesNotificationCategoryKey(identifier: String) =
    NOTIFICATION_CATEGORY_KEY_PREFIX + identifier
}
