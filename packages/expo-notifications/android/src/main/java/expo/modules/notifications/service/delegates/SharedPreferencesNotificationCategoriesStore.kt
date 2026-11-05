package expo.modules.notifications.service.delegates

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.notifications.notifications.categories.NotificationCategoryRecord
import expo.modules.notifications.notifications.model.NotificationCategory
import kotlinx.serialization.json.Json
import java.io.IOException

class SharedPreferencesNotificationCategoriesStore(context: Context) {
  private val sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun getNotificationCategory(identifier: String): NotificationCategoryRecord? = synchronized(lock) {
    decode(identifier)
  }

  val allNotificationCategories: Collection<NotificationCategoryRecord>
    get() = synchronized(lock) {
      val entries = sharedPreferences.all
      entries.keys.mapNotNull(::categoryIdentifier).distinct().mapNotNull(::decode)
    }

  fun saveNotificationCategory(category: NotificationCategoryRecord): NotificationCategoryRecord = synchronized(lock) {
    val encoded = encode(category)
    commit(
      sharedPreferences.edit()
        .remove(LEGACY_PREFIX + category.identifier)
        .putString(RECORD_PREFIX + category.identifier, encoded)
    )
    category
  }

  fun setNotificationCategories(
    categories: Collection<NotificationCategoryRecord>,
    replaces: (identifier: String) -> Boolean = { true }
  ) = synchronized(lock) {
    val encoded = categories.associate { it.identifier to encode(it) }
    if (encoded.size != categories.size) {
      throw InvalidArgumentException("Could not replace notification categories because identifiers are duplicated. Use a unique identifier for each category.")
    }
    val editor = sharedPreferences.edit()
    sharedPreferences.all.keys.filter { key -> categoryIdentifier(key)?.let(replaces) == true }.forEach(editor::remove)
    encoded.forEach { (identifier, value) -> editor.putString(RECORD_PREFIX + identifier, value) }
    commit(editor)
  }

  fun removeNotificationCategory(identifier: String): Boolean = synchronized(lock) {
    val legacyKey = LEGACY_PREFIX + identifier
    val recordKey = RECORD_PREFIX + identifier
    if (!sharedPreferences.contains(legacyKey) && !sharedPreferences.contains(recordKey)) {
      return@synchronized false
    }
    commit(sharedPreferences.edit().remove(legacyKey).remove(recordKey))
    true
  }

  private fun encode(category: NotificationCategoryRecord): String {
    if (category.actions.isEmpty()) {
      throw InvalidArgumentException("Could not save notification category '${category.identifier}' because it has no actions. Provide at least one action.")
    }
    return json.encodeToString(category)
  }

  private fun decode(identifier: String): NotificationCategoryRecord? {
    return try {
      sharedPreferences.getString(RECORD_PREFIX + identifier, null)?.let {
        return json.decodeFromString<NotificationCategoryRecord>(it)
      }
      sharedPreferences.getString(LEGACY_PREFIX + identifier, null)?.let {
        NotificationCategoryRecord.fromLegacy(it.asBase64EncodedObject<NotificationCategory>())
      }
    } catch (e: Exception) {
      Log.w("expo-notifications", "Could not read notification category '$identifier'. Register the category again to replace its invalid stored data.", e)
      null
    }
  }

  private fun categoryIdentifier(key: String): String? = when {
    key.startsWith(RECORD_PREFIX) -> key.removePrefix(RECORD_PREFIX)
    key.startsWith(LEGACY_PREFIX) -> key.removePrefix(LEGACY_PREFIX)
    else -> null
  }

  private fun commit(editor: SharedPreferences.Editor) {
    if (!editor.commit()) {
      throw IOException("Could not persist notification categories. Check the available device storage and try again.")
    }
  }

  companion object {
    private const val SHARED_PREFERENCES_NAME = "expo.modules.notifications.SharedPreferencesNotificationCategoriesStore"
    private const val LEGACY_PREFIX = "notification_category-"
    private const val RECORD_PREFIX = "expo_notification_category_record_"
    private val json = Json { ignoreUnknownKeys = true }

    // Module and notification-service instances share this preferences file.
    private val lock = Any()
  }
}
