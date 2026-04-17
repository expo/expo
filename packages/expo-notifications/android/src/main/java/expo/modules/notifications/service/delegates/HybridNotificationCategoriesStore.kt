package expo.modules.notifications.service.delegates

import android.content.Context
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import expo.modules.notifications.notifications.categories.NotificationCategoryRecord
import expo.modules.notifications.notifications.model.NotificationCategory
import kotlinx.serialization.json.Json

/**
 * A hybrid notification categories store that can:
 * 1. Read categories from both old format (Java objects) and new format (Record objects)
 * 2. Write new format categories (via setBulkCategories from setNotificationCategoriesAsync)
 * 3. Combine results from both formats, with new format taking precedence on conflicts
 * 4. Support legacy individual category operations alongside new bulk operations
 */
class HybridNotificationCategoriesStore(
  private val legacyStore: SharedPreferencesNotificationCategoriesStore,
  private val sharedPreferences: android.content.SharedPreferences
) {
  constructor(context: Context, legacyStore: SharedPreferencesNotificationCategoriesStore) : this(
    legacyStore,
    context.getSharedPreferences(
      "expo.modules.notifications.SharedPreferencesNotificationCategoriesStore",
      Context.MODE_PRIVATE
    )
  )

  companion object {
    private const val NEW_FORMAT_PREFIX = "expo_notification_category_record_"
  }

  /**
   * Gets all notification categories, combining both old and new storage formats.
   * New format takes precedence over old format for categories with same identifier.
   */
  fun getAllCategories(): Collection<NotificationCategoryRecord> {
    val newFormatCategories = getNewFormatCategories()
    val legacyCategories = getLegacyCategories()

    // Create a map to handle conflicts (new format wins)
    val combinedMap = mutableMapOf<String, NotificationCategoryRecord>()

    // Add legacy categories first
    legacyCategories.forEach { category ->
      combinedMap[category.identifier] = category
    }

    // Add new format categories (these will overwrite any conflicts)
    newFormatCategories.forEach { category ->
      combinedMap[category.identifier] = category
    }

    return combinedMap.values
  }

  /**
   * Deletes a single notification category by identifier.
   * This will delete from both old and new format storage if the identifier exists.
   * Returns true if a category was deleted, false if no category with that identifier was found.
   */
  fun deleteCategory(identifier: String): Boolean {
    // Delete from legacy storage
    val deletedFromLegacy = legacyStore.removeNotificationCategory(identifier)

    // Delete from new format storage
    val newFormatKey = newFormatKey(identifier)
    val deletedFromNew = sharedPreferences.contains(newFormatKey)
    if (deletedFromNew) {
      sharedPreferences.edit().remove(newFormatKey).apply()
    }

    return deletedFromLegacy || deletedFromNew
  }

  /**
   * Sets all notification categories using the new format.
   * This clears both old and new format storage and saves only the provided categories.
   * Used by setNotificationCategoriesAsync.
   */
  fun setBulkCategories(categories: Collection<NotificationCategoryRecord>) {
    val editor = sharedPreferences.edit()

    // Clear ALL existing categories (both old and new format)
    clearAllCategories(editor)

    // Save new categories in new format
    for (category in categories) {
      if (category.actions.isEmpty()) {
        throw InvalidArgumentException("Must provide at least one action.")
      }
      val json = Json.encodeToString(category)
      editor.putString(newFormatKey(category.identifier), json)
    }

    editor.commit()
  }

  /**
   * Saves a single notification category in the new format.
   * Also removes any legacy version with the same identifier.
   */
  fun saveCategory(category: NotificationCategoryRecord) {
    if (category.actions.isEmpty()) {
      throw InvalidArgumentException("Must provide at least one action.")
    }
    val json = Json.encodeToString(category)
    sharedPreferences.edit().putString(newFormatKey(category.identifier), json).apply()
    // Also remove legacy version if it exists
    legacyStore.removeNotificationCategory(category.identifier)
  }

  private fun getNewFormatCategories(): List<NotificationCategoryRecord> {
    val categories = mutableListOf<NotificationCategoryRecord>()

    for ((key, value) in sharedPreferences.all) {
      if (value is String && key.startsWith(NEW_FORMAT_PREFIX)) {
        val category = Json.decodeFromString<NotificationCategoryRecord>(value)
        categories.add(category)
      }
    }

    return categories
  }

  private fun getLegacyCategories(): List<NotificationCategoryRecord> {
    val legacyCategories = legacyStore.allNotificationCategories
    return legacyCategories.map { convertFromLegacy(it) }
  }

  private fun clearAllCategories(editor: android.content.SharedPreferences.Editor) {
    // Clear old format categories using the legacy store's proper method
    legacyStore.deleteAllNotificationCategories()

    // Clear new format categories
    sharedPreferences.all
      .filter { it.key.startsWith(NEW_FORMAT_PREFIX) }
      .forEach { (key, _) -> editor.remove(key) }
  }

  private fun newFormatKey(identifier: String): String {
    return NEW_FORMAT_PREFIX + identifier
  }

  private fun convertFromLegacy(legacyCategory: NotificationCategory): NotificationCategoryRecord {
    val convertedActions = legacyCategory.actions.map { NotificationActionRecord.fromLegacy(it) }

    return NotificationCategoryRecord(legacyCategory.identifier, convertedActions)
  }
}
