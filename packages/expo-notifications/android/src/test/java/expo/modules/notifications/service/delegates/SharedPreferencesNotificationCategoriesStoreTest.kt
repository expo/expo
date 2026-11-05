package expo.modules.notifications.service.delegates

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import expo.modules.notifications.notifications.categories.NotificationCategoryRecord
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue

@RunWith(RobolectricTestRunner::class)
class SharedPreferencesNotificationCategoriesStoreTest {
  private lateinit var store: SharedPreferencesNotificationCategoriesStore
  private lateinit var context: Context

  @Before
  fun setup() {
    context = ApplicationProvider.getApplicationContext()
    store = SharedPreferencesNotificationCategoriesStore(context)

    clearAllStoredCategories()
  }

  @Test
  fun `fresh install returns empty categories`() {
    val categories = store.allNotificationCategories
    assertTrue("Fresh install should return empty categories", categories.isEmpty())
  }

  @Test
  fun `reads only legacy format when no new format exists`() {
    val legacyCategory1 = NotificationCategory("legacy1", listOf(NotificationAction("action1", "Action 1", true)))
    val legacyCategory2 = NotificationCategory(
      "legacy2",
      listOf(
        NotificationAction("action2", "Action 2", false),
        TextInputNotificationAction("text_action", "Text Action", false, "Type here")
      )
    )

    saveLegacyCategory(legacyCategory1)
    saveLegacyCategory(legacyCategory2)

    val categories = store.allNotificationCategories
    assertTrue("Should read 2 legacy categories, got ${categories.size}", categories.size == 2)

    val identifiers = categories.map { it.identifier }.toSet()
    assertTrue("Should contain legacy1", identifiers.contains("legacy1"))
    assertTrue("Should contain legacy2", identifiers.contains("legacy2"))
  }

  @Test
  fun `combines legacy and new format categories when legacy inserts come after`() {
    val newCategory1 = NotificationCategoryRecord("new1", listOf(createActionRecord("action3", "New Action 1", true)))
    val newCategory2 = NotificationCategoryRecord("new2", listOf(createActionRecord("action4", "New Action 2", false)))
    store.setNotificationCategories(listOf(newCategory1, newCategory2))

    val legacyCategory1 = NotificationCategory("legacy1", listOf(NotificationAction("action1", "Legacy Action 1", true)))
    val legacyCategory2 = NotificationCategory("legacy2", listOf(NotificationAction("action2", "Legacy Action 2", false)))

    saveLegacyCategory(legacyCategory1)
    saveLegacyCategory(legacyCategory2)

    val categories = store.allNotificationCategories
    assertEquals(categories.map { it.identifier }.toSet(), setOf("new1", "new2", "legacy1", "legacy2"))

    val legacy1 = categories.find { it.identifier == "legacy1" }!!
    assertTrue("Should preserve legacy content", legacy1.actions[0].buttonTitle == "Legacy Action 1")

    val new1 = categories.find { it.identifier == "new1" }!!
    assertTrue("Should preserve new content", new1.actions[0].buttonTitle == "New Action 1")
  }

  @Test
  fun `handles identifier conflicts - new format wins`() {
    val legacyCategory = NotificationCategory("conflict", listOf(NotificationAction("legacy_action", "Legacy Action", true)))
    saveLegacyCategory(legacyCategory)

    val newCategoryConflict = NotificationCategoryRecord("conflict", listOf(createActionRecord("new_action", "New Action", false)))
    val newCategoryOther = NotificationCategoryRecord("other", listOf(createActionRecord("other_action", "Other Action", true)))

    store.setNotificationCategories(listOf(newCategoryConflict, newCategoryOther))

    val categories = store.allNotificationCategories
    assertEquals(categories.map { it.identifier }.toSet(), setOf("conflict", "other"))

    val conflictCategory = categories.find { it.identifier == "conflict" }!!
    assertTrue("Should be new format action", conflictCategory.actions[0].identifier == "new_action")
    assertTrue("Should have new format properties", !conflictCategory.actions[0].options.opensAppToForeground)
  }

  @Test
  fun `bulk replacement clears both storage formats`() {
    val legacyCategory = NotificationCategory("legacy", listOf(NotificationAction("action", "Legacy", true)))
    saveLegacyCategory(legacyCategory)

    val oldNewCategory = NotificationCategoryRecord("old_new", listOf(createActionRecord("action", "Old New", false)))
    store.setNotificationCategories(listOf(oldNewCategory))

    val initialCategories = store.allNotificationCategories
    assertTrue("Step 3 failed", initialCategories.map { it.identifier }.toSet() == setOf("old_new"))

    val replacementCategory = NotificationCategoryRecord("replacement", listOf(createActionRecord("replace_action", "Replacement", true)))
    store.setNotificationCategories(listOf(replacementCategory))

    val finalCategories = store.allNotificationCategories
    assertTrue("Should only have 1 category after replacement, got ${finalCategories.size}", finalCategories.size == 1)
    assertTrue("Should only contain replacement category", finalCategories.first().identifier == "replacement")

    val legacyCategories = legacyCategories()
    assertTrue("Legacy storage should be cleared", legacyCategories.isEmpty())
  }

  @Test
  fun `reads legacy entries written after a bulk replacement`() {
    val bulkCategory = NotificationCategoryRecord("bulk", listOf(createActionRecord("bulk_action", "Bulk Action", true)))
    store.setNotificationCategories(listOf(bulkCategory))

    val newLegacyCategory = NotificationCategory("new_legacy", listOf(NotificationAction("legacy_action", "New Legacy", false)))
    saveLegacyCategory(newLegacyCategory)

    val categories = store.allNotificationCategories
    assertTrue("Should see both bulk and legacy categories, got ${categories.size}", categories.size == 2)

    val identifiers = categories.map { it.identifier }.toSet()
    assertTrue("Should contain bulk category", identifiers.contains("bulk"))
    assertTrue("Should contain new legacy category", identifiers.contains("new_legacy"))
  }

  @Test
  fun `empty bulk replacement clears categories`() {
    val legacyCategory = NotificationCategory("legacy", listOf(NotificationAction("action", "Action", true)))
    saveLegacyCategory(legacyCategory)

    val newCategory = NotificationCategoryRecord("new", listOf(createActionRecord("action", "Action", true)))
    store.setNotificationCategories(listOf(newCategory))

    store.setNotificationCategories(emptyList())

    val categories = store.allNotificationCategories
    assertEquals(categories.size, 0)

    val legacyCategories = legacyCategories()
    assertTrue(legacyCategories.isEmpty())
  }

  @Test
  fun `delete single categories`() {
    val newCategory1 = NotificationCategoryRecord("new1", listOf(createActionRecord("action3", "New Action 1", true)))
    val newCategory2 = NotificationCategoryRecord("new2", listOf(createActionRecord("action4", "New Action 2", false)))

    store.setNotificationCategories(listOf(newCategory1, newCategory2))

    val legacyCategory1 = NotificationCategory("legacy1", listOf(NotificationAction("action1", "Legacy Action 1", true)))
    val legacyCategory2 = NotificationCategory("legacy2", listOf(NotificationAction("action2", "Legacy Action 2", false)))

    saveLegacyCategory(legacyCategory1)
    saveLegacyCategory(legacyCategory2)

    val categoriesBefore = store.allNotificationCategories
    assertEquals(categoriesBefore.map { it.identifier }.toSet(), setOf("legacy1", "legacy2", "new1", "new2"))

    val deletedLegacy = store.removeNotificationCategory("legacy1")
    assertTrue(deletedLegacy)

    val deletedNew = store.removeNotificationCategory("new1")
    assertTrue(deletedNew)

    val categoriesAfter = store.allNotificationCategories
    assertEquals(categoriesAfter.map { it.identifier }.toSet(), setOf("legacy2", "new2"))

    val finalLegacy2 = categoriesAfter.find { it.identifier == "legacy2" }!!
    assertEquals(finalLegacy2.actions[0].buttonTitle, "Legacy Action 2")

    val finalNew2 = categoriesAfter.find { it.identifier == "new2" }!!
    assertEquals(finalNew2.actions[0].buttonTitle, "New Action 2")
  }

  @Test
  fun `deletes categories from either storage format`() {
    val legacyCategory = NotificationCategory("legacy", listOf(NotificationAction("action1", "Legacy Action", true)))
    saveLegacyCategory(legacyCategory)

    val newCategory = NotificationCategoryRecord("new", listOf(createActionRecord("action2", "New Action", false)))
    store.setNotificationCategories(listOf(newCategory))

    saveLegacyCategory(legacyCategory)

    val categoriesBefore = store.allNotificationCategories
    assertEquals(categoriesBefore.map { it.identifier }.toSet(), setOf("legacy", "new"))

    val deletedLegacy = store.removeNotificationCategory("legacy")
    assertTrue(deletedLegacy)

    val categoriesAfterLegacyDelete = store.allNotificationCategories
    assertEquals(categoriesAfterLegacyDelete.map { it.identifier }.toSet(), setOf("new"))

    val deletedNew = store.removeNotificationCategory("new")
    assertTrue(deletedNew)

    val categoriesAfterAllDeleted = store.allNotificationCategories
    assertTrue(categoriesAfterAllDeleted.isEmpty())

    val deletedNonExistent = store.removeNotificationCategory("nonexistent")
    assertTrue("Should return false for non-existent category", !deletedNonExistent)
  }

  @Test
  fun `deletes both storage formats for the same identifier`() {
    val legacyCategory = NotificationCategory("same_id", listOf(NotificationAction("legacy_action", "Legacy", true)))
    saveLegacyCategory(legacyCategory)

    val newCategory = NotificationCategoryRecord("same_id", listOf(createActionRecord("new_action", "New", false)))
    store.setNotificationCategories(listOf(newCategory))

    saveLegacyCategory(legacyCategory)

    val categoriesBefore = store.allNotificationCategories
    assertEquals(categoriesBefore.size, 1)
    val category = categoriesBefore.first()
    assertEquals(category.identifier, "same_id")
    assertEquals(category.actions[0].identifier, "new_action") // Should be new format

    val deleted = store.removeNotificationCategory("same_id")
    assertTrue(deleted)

    val categoriesAfter = store.allNotificationCategories
    assertTrue(categoriesAfter.isEmpty())

    val legacyCategories = legacyCategories()
    assertTrue(legacyCategories.isEmpty())
  }

  @Test
  fun `setCategory saves in new format and removes legacy version`() {
    val legacyCategory = NotificationCategory("test_id", listOf(NotificationAction("action1", "Legacy Action", true)))
    saveLegacyCategory(legacyCategory)

    val categoriesBefore = store.allNotificationCategories
    assertEquals(1, categoriesBefore.size)
    assertEquals("Legacy Action", categoriesBefore.first().actions[0].buttonTitle)

    val newCategory = NotificationCategoryRecord("test_id", listOf(createActionRecord("action2", "New Action", false)))
    store.saveNotificationCategory(newCategory)

    val categoriesAfter = store.allNotificationCategories
    assertEquals(1, categoriesAfter.size)
    val category = categoriesAfter.first()
    assertEquals("test_id", category.identifier)
    assertEquals("action2", category.actions[0].identifier)
    assertEquals("New Action", category.actions[0].buttonTitle)

    val legacyCategories = legacyCategories()
    assertTrue(legacyCategories.isEmpty())
  }

  @Test
  fun `setCategory adds new category without affecting others`() {
    val existing = NotificationCategoryRecord("existing", listOf(createActionRecord("action1", "Existing", true)))
    store.saveNotificationCategory(existing)

    val another = NotificationCategoryRecord("another", listOf(createActionRecord("action2", "Another", false)))
    store.saveNotificationCategory(another)

    val categories = store.allNotificationCategories
    assertEquals(setOf("existing", "another"), categories.map { it.identifier }.toSet())
  }

  @Test
  fun `scoped bulk replacement keeps categories outside the scope`() {
    saveLegacyCategory(NotificationCategory("other/legacy", listOf(NotificationAction("a", "A", true))))
    store.saveNotificationCategory(NotificationCategoryRecord("other/json", listOf(createActionRecord("a", "A", true))))
    store.saveNotificationCategory(NotificationCategoryRecord("mine/old", listOf(createActionRecord("a", "A", true))))
    saveLegacyCategory(NotificationCategory("mine/legacy", listOf(NotificationAction("a", "A", true))))

    store.setNotificationCategories(
      listOf(NotificationCategoryRecord("mine/new", listOf(createActionRecord("a", "A", true))))
    ) { it.startsWith("mine/") }

    assertEquals(setOf("other/legacy", "other/json", "mine/new"), store.allNotificationCategories.map { it.identifier }.toSet())
  }

  @Test
  fun `invalid bulk replacement preserves existing categories`() {
    saveLegacyCategory(NotificationCategory("legacy", listOf(NotificationAction("a", "A", true))))
    try {
      store.setNotificationCategories(listOf(NotificationCategoryRecord("invalid", emptyList())))
      org.junit.Assert.fail("Expected invalid category to be rejected")
    } catch (_: expo.modules.core.errors.InvalidArgumentException) {
      assertEquals(setOf("legacy"), store.allNotificationCategories.map { it.identifier }.toSet())
    }
  }

  @Test
  fun `corrupt JSON does not hide healthy categories`() {
    store.saveNotificationCategory(NotificationCategoryRecord("healthy", listOf(createActionRecord("a", "A", true))))
    context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
      .edit().putString("expo_notification_category_record_corrupt", "{").commit()
    assertEquals(setOf("healthy"), store.allNotificationCategories.map { it.identifier }.toSet())
  }

  @Test
  fun `JSON entries missing required fields do not hide healthy categories`() {
    store.saveNotificationCategory(NotificationCategoryRecord("healthy", listOf(createActionRecord("a", "A", true))))
    context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
      .edit()
      .putString("expo_notification_category_record_missing_category", "{}")
      .putString("expo_notification_category_record_missing_action", """{"identifier":"missing_action","actions":[{}]}""")
      .commit()
    assertEquals(setOf("healthy"), store.allNotificationCategories.map { it.identifier }.toSet())
  }

  private fun saveLegacyCategory(category: NotificationCategory) {
    context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
      .edit().putString("notification_category-" + category.identifier, category.encodedInBase64()).commit()
  }

  private fun legacyCategories() = context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
    .all.filterKeys { it.startsWith("notification_category-") }

  private fun createActionRecord(
    identifier: String,
    buttonTitle: String,
    opensToForeground: Boolean
  ): NotificationActionRecord {
    return NotificationActionRecord(
      identifier,
      buttonTitle,
      null,
      NotificationActionRecord.Options(opensToForeground)
    )
  }

  private fun clearAllStoredCategories() {
    val sharedPrefs = context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
    sharedPrefs.edit().clear().commit()
  }
}
