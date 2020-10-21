package expo.modules.notifications.service.delegates

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import expo.modules.notifications.notifications.model.NotificationCategory
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InvalidClassException
import java.io.ObjectInputStream
import java.io.ObjectOutputStream

/**
 * A fairly straightforward [SharedPreferences] wrapper to be used by [NotificationSchedulingHelper].
 * Saves and reads notification category information (identifiers, actions, and options) to and from persistent storage.
 *
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
   * @throws JSONException          Thrown if notification category could not be interpreted as a JSON object.
   * @throws IOException            Thrown if there is an error when fetching the category from storage.
   * @throws ClassNotFoundException Thrown if there is an error when interpreting the category fetched from storage.
   */
  @Throws(IOException::class, ClassNotFoundException::class)
  fun getNotificationCategory(identifier: String) =
    deserializeNotificationCategory(
      sharedPreferences.getString(
        preferencesNotificationCategoryKey(identifier),
        null
      )
    )

  /**
   * Fetches all categories, ignoring invalid ones.
   *
   *
   * Goes through all the [SharedPreferences] entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and category info as values
   */
  val allNotificationCategories: Collection<NotificationCategory>
    get() =
      sharedPreferences.all.mapNotNull { (key, value) ->
        if (key.startsWith(NOTIFICATION_CATEGORY_KEY_PREFIX)) {
          try {
            return@mapNotNull deserializeNotificationCategory(value as String?)
          } catch (e: ClassNotFoundException) {
            // do nothing
          } catch (e: IOException) {
            // do nothing
          }
        }
        null
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
        serializeNotificationCategory(notificationCategory)
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
    sharedPreferences.getString(
      preferencesNotificationCategoryKey(identifier),
      null
    ).let { if (it == null) return false }

    return sharedPreferences
      .edit()
      .remove(preferencesNotificationCategoryKey(identifier))
      .commit()
  }

  /**
   * Serializes the category to a Base64-encoded string.
   *
   * @param notificationCategory Notification category to serialize
   * @return Base64-encoded, serialized category
   * @throws IOException Thrown if there is an error while writing category to string.
   */
  @Throws(IOException::class)
  private fun serializeNotificationCategory(notificationCategory: NotificationCategory) =
    ByteArrayOutputStream().use { byteArrayOutputStream ->
      ObjectOutputStream(byteArrayOutputStream).use { objectOutputStream ->
        objectOutputStream.writeObject(notificationCategory)
        Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP)
      }
    }

  /**
   * Deserializes the category from the string representation.
   *
   * @param category Base64-encoded, serialized category representation
   * @return Deserialized category or null
   * @throws IOException            Thrown if there is an error while reading category from String
   * @throws ClassNotFoundException Thrown if the deserialization failes due to class not being found.
   * @throws InvalidClassException  Thrown if the category is of invalid class.
   */
  @Throws(IOException::class, ClassNotFoundException::class, InvalidClassException::class)
  private fun deserializeNotificationCategory(category: String?): NotificationCategory? {
    category?.let {
      val data = Base64.decode(it, Base64.NO_WRAP)
      ByteArrayInputStream(data).use { byteArrayInputStream ->
        ObjectInputStream(byteArrayInputStream).use { ois ->
          val o = ois.readObject()
          if (o is NotificationCategory) {
            return o
          }
          throw InvalidClassException("Expected serialized notification category to be an instance of NotificationCategory. Found: $o")
        }
      }
    }
    return null
  }

  /**
   * @param identifier Category identifier
   * @return Key under which the notification category will be persisted in storage.
   */
  private fun preferencesNotificationCategoryKey(identifier: String) =
    NOTIFICATION_CATEGORY_KEY_PREFIX + identifier
}
