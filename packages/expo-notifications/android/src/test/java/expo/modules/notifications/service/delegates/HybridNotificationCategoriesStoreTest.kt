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
class HybridNotificationCategoriesStoreTest {
  private lateinit var hybridStore: HybridNotificationCategoriesStore
  private lateinit var legacyStore: SharedPreferencesNotificationCategoriesStore
  private lateinit var context: Context

  @Before
  fun setup() {
    context = ApplicationProvider.getApplicationContext()
    legacyStore = SharedPreferencesNotificationCategoriesStore(context)
    hybridStore = HybridNotificationCategoriesStore(context, legacyStore)

    // Clear all existing data
    clearAllStoredCategories()
  }

  @Test
  fun `fresh install returns empty categories`() {
    val categories = hybridStore.getAllCategories()
    assert(categories.isEmpty()) { "Fresh install should return empty categories" }
  }

  @Test
  fun `reads only legacy format when no new format exists`() {
    val legacyCategory1 = NotificationCategory("legacy1", listOf(NotificationAction("action1", "Action 1", true)))
    val legacyCategory2 = NotificationCategory("legacy2",
      listOf(
        NotificationAction("action2", "Action 2", false),
        TextInputNotificationAction("text_action", "Text Action", false, "Type here")
      )
    )
    
    legacyStore.saveNotificationCategory(legacyCategory1)
    legacyStore.saveNotificationCategory(legacyCategory2)
    
    val categories = hybridStore.getAllCategories()
    assert(categories.size == 2) { "Should read 2 legacy categories, got ${categories.size}" }
    
    val identifiers = categories.map { it.identifier }.toSet()
    assert(identifiers.contains("legacy1")) { "Should contain legacy1" }
    assert(identifiers.contains("legacy2")) { "Should contain legacy2" }
  }

  @Test
  fun `combines legacy and new format categories when legacy inserts come after`() {
    // Step 1: Store some categories via setNotificationCategoriesAsync (new format)
    val newCategory1 = NotificationCategoryRecord("new1", listOf(createActionRecord("action3", "New Action 1", true)))
    val newCategory2 = NotificationCategoryRecord("new2", listOf(createActionRecord("action4", "New Action 2", false)))
    hybridStore.setBulkCategories(listOf(newCategory1, newCategory2))

    // Step 2: Store some categories via setNotificationCategoryAsync (legacy format)
    val legacyCategory1 = NotificationCategory("legacy1", listOf(NotificationAction("action1", "Legacy Action 1", true)))
    val legacyCategory2 = NotificationCategory("legacy2", listOf(NotificationAction("action2", "Legacy Action 2", false)))

    legacyStore.saveNotificationCategory(legacyCategory1)
    legacyStore.saveNotificationCategory(legacyCategory2)
    
    // Step 3: Read all - should get combined results (4 total)
    val categories = hybridStore.getAllCategories()
    assertEquals(categories.map { it.identifier }.toSet(), setOf("new1", "new2", "legacy1", "legacy2"))

    // Verify we can distinguish between formats by checking action content
    val legacy1 = categories.find { it.identifier == "legacy1" }!!
    assert(legacy1.actions[0].buttonTitle == "Legacy Action 1") { "Should preserve legacy content" }
    
    val new1 = categories.find { it.identifier == "new1" }!!
    assert(new1.actions[0].buttonTitle == "New Action 1") { "Should preserve new content" }
  }

  @Test
  fun `handles identifier conflicts - new format wins`() {
    // Step 1: Store legacy category with ID "conflict"
    val legacyCategory = NotificationCategory("conflict", listOf(NotificationAction("legacy_action", "Legacy Action", true)))
    legacyStore.saveNotificationCategory(legacyCategory)
    
    // Step 2: Store new format categories including same ID "conflict"
    val newCategoryConflict = NotificationCategoryRecord("conflict", listOf(createActionRecord("new_action", "New Action", false)))
    val newCategoryOther = NotificationCategoryRecord("other", listOf(createActionRecord("other_action", "Other Action", true)))
    
    hybridStore.setBulkCategories(listOf(newCategoryConflict, newCategoryOther))
    
    // Step 3: Read all - should get new format version of "conflict" + "other"
    val categories = hybridStore.getAllCategories()
    assertEquals(categories.map { it.identifier }.toSet(), setOf("conflict", "other"))

    // Verify it's the NEW format version that wins
    val conflictCategory = categories.find { it.identifier == "conflict" }!!
    assert(conflictCategory.actions[0].identifier == "new_action") { "Should be new format action" }
    assert(!conflictCategory.actions[0].options.opensAppToForeground) { "Should have new format properties" }
  }

  @Test
  fun `setBulkCategories replaces ALL categories - both legacy and new`() {
    // Step 1: Set up mixed storage
    val legacyCategory = NotificationCategory("legacy", listOf(NotificationAction("action", "Legacy", true)))
    legacyStore.saveNotificationCategory(legacyCategory)
    
    val oldNewCategory = NotificationCategoryRecord("old_new", listOf(createActionRecord("action", "Old New", false)))
    hybridStore.setBulkCategories(listOf(oldNewCategory))
    
    // Verify initial state - should have new only
    val initialCategories = hybridStore.getAllCategories()
    assert(initialCategories.map { it.identifier }.toSet() == setOf("old_new")) { "Step 3 failed" }

    // Step 2: Call setBulkCategories with completely new set
    val replacementCategory = NotificationCategoryRecord("replacement", listOf(createActionRecord("replace_action", "Replacement", true)))
    hybridStore.setBulkCategories(listOf(replacementCategory))
    
    // Step 3: Should now only have replacement category
    val finalCategories = hybridStore.getAllCategories()
    assert(finalCategories.size == 1) { "Should only have 1 category after replacement, got ${finalCategories.size}" }
    assert(finalCategories.first().identifier == "replacement") { "Should only contain replacement category" }
    
    // Verify legacy storage is also cleared
    val legacyCategories = legacyStore.allNotificationCategories
    assert(legacyCategories.isEmpty()) { "Legacy storage should be cleared" }
  }

  @Test
  fun `individual legacy operations still work but only AFTER bulk operations`() {
    // Step 1: Use bulk API to set some categories
    val bulkCategory = NotificationCategoryRecord("bulk", listOf(createActionRecord("bulk_action", "Bulk Action", true)))
    hybridStore.setBulkCategories(listOf(bulkCategory))
    
    // Step 2: Use legacy API to add another category (simulating continued use of deprecated API)
    val newLegacyCategory = NotificationCategory("new_legacy", listOf(NotificationAction("legacy_action", "New Legacy", false)))
    legacyStore.saveNotificationCategory(newLegacyCategory)
    
    // Step 3: Read all - should see both
    val categories = hybridStore.getAllCategories()
    assert(categories.size == 2) { "Should see both bulk and legacy categories, got ${categories.size}" }
    
    val identifiers = categories.map { it.identifier }.toSet()
    assert(identifiers.contains("bulk")) { "Should contain bulk category" }
    assert(identifiers.contains("new_legacy")) { "Should contain new legacy category" }
  }

  @Test
  fun `empty setBulkCategories clears everything`() {
    // Set up mixed data
    val legacyCategory = NotificationCategory("legacy", listOf(NotificationAction("action", "Action", true)))
    legacyStore.saveNotificationCategory(legacyCategory)
    
    val newCategory = NotificationCategoryRecord("new", listOf(createActionRecord("action", "Action", true)))
    hybridStore.setBulkCategories(listOf(newCategory))
    
    // Clear with empty list
    hybridStore.setBulkCategories(emptyList())
    
    // Verify everything is cleared
    val categories = hybridStore.getAllCategories()
    assertEquals(categories.size, 0)

    val legacyCategories = legacyStore.allNotificationCategories
    assertTrue(legacyCategories.isEmpty())
  }

  @Test
  fun `delete single categories`() {
    // Set up some new format categories
    val newCategory1 = NotificationCategoryRecord("new1", listOf(createActionRecord("action3", "New Action 1", true)))
    val newCategory2 = NotificationCategoryRecord("new2", listOf(createActionRecord("action4", "New Action 2", false)))

    hybridStore.setBulkCategories(listOf(newCategory1, newCategory2))

    // Set up some legacy categories
    val legacyCategory1 = NotificationCategory("legacy1", listOf(NotificationAction("action1", "Legacy Action 1", true)))
    val legacyCategory2 = NotificationCategory("legacy2", listOf(NotificationAction("action2", "Legacy Action 2", false)))
    
    legacyStore.saveNotificationCategory(legacyCategory1)
    legacyStore.saveNotificationCategory(legacyCategory2)
    

    // Verify all 4 exist
    val categoriesBefore = hybridStore.getAllCategories()
    assertEquals(categoriesBefore.map { it.identifier }.toSet(), setOf("legacy1", "legacy2", "new1", "new2"))
    
    // Delete one legacy category using hybrid store
    val deletedLegacy = hybridStore.deleteCategory("legacy1")
    assertTrue(deletedLegacy)

    // Delete one new category using hybrid store
    val deletedNew = hybridStore.deleteCategory("new1")
    assertTrue(deletedNew)

    // Verify final state: legacy2 and new2 remain
    val categoriesAfter = hybridStore.getAllCategories()
    assertEquals(categoriesAfter.map { it.identifier }.toSet(), setOf("legacy2", "new2"))
    
    // Verify the content is correct
    val finalLegacy2 = categoriesAfter.find { it.identifier == "legacy2" }!!
    assertEquals(finalLegacy2.actions[0].buttonTitle, "Legacy Action 2")
    
    val finalNew2 = categoriesAfter.find { it.identifier == "new2" }!!
    assertEquals(finalNew2.actions[0].buttonTitle, "New Action 2")
  }

  @Test
  fun `hybridStore deleteCategory method works for both storage formats`() {
    // Set up legacy category
    val legacyCategory = NotificationCategory("legacy", listOf(NotificationAction("action1", "Legacy Action", true)))
    legacyStore.saveNotificationCategory(legacyCategory)
    
    // Set up new format category
    val newCategory = NotificationCategoryRecord("new", listOf(createActionRecord("action2", "New Action", false)))
    hybridStore.setBulkCategories(listOf(newCategory))
    
    // Re-add legacy category since setBulkCategories cleared it
    legacyStore.saveNotificationCategory(legacyCategory)
    
    // Verify both exist
    val categoriesBefore = hybridStore.getAllCategories()
    assertEquals(categoriesBefore.map { it.identifier }.toSet(), setOf("legacy", "new"))
    
    // Delete legacy category using hybrid store
    val deletedLegacy = hybridStore.deleteCategory("legacy")
    assertTrue(deletedLegacy)
    
    // Verify only new category remains
    val categoriesAfterLegacyDelete = hybridStore.getAllCategories()
    assertEquals(categoriesAfterLegacyDelete.map { it.identifier }.toSet(), setOf("new"))
    
    // Delete new category using hybrid store
    val deletedNew = hybridStore.deleteCategory("new")
    assertTrue(deletedNew)
    
    // Verify no categories remain
    val categoriesAfterAllDeleted = hybridStore.getAllCategories()
    assertTrue(categoriesAfterAllDeleted.isEmpty())
    
    // Try to delete non-existent category
    val deletedNonExistent = hybridStore.deleteCategory("nonexistent")
    assertTrue("Should return false for non-existent category", !deletedNonExistent)
  }

  @Test
  fun `hybridStore deleteCategory handles duplicate identifiers correctly`() {
    // Create categories with same identifier in both formats
    val legacyCategory = NotificationCategory("same_id", listOf(NotificationAction("legacy_action", "Legacy", true)))
    legacyStore.saveNotificationCategory(legacyCategory)
    
    val newCategory = NotificationCategoryRecord("same_id", listOf(createActionRecord("new_action", "New", false)))
    hybridStore.setBulkCategories(listOf(newCategory))
    
    // Re-add legacy (this creates the conflict scenario)
    legacyStore.saveNotificationCategory(legacyCategory)
    
    // Verify we see the new format version (it should win conflicts)
    val categoriesBefore = hybridStore.getAllCategories()
    assertEquals(categoriesBefore.size, 1)
    val category = categoriesBefore.first()
    assertEquals(category.identifier, "same_id")
    assertEquals(category.actions[0].identifier, "new_action") // Should be new format
    
    // Delete using hybrid store - should remove from both storages
    val deleted = hybridStore.deleteCategory("same_id")
    assertTrue(deleted)
    
    // Verify completely gone from both storages
    val categoriesAfter = hybridStore.getAllCategories()
    assertTrue(categoriesAfter.isEmpty())
    
    // Verify gone from legacy storage too
    val legacyCategories = legacyStore.allNotificationCategories
    assertTrue(legacyCategories.isEmpty())
  }

  // Helper methods
  private fun createActionRecord(
    identifier: String, 
    buttonTitle: String, 
    opensToForeground: Boolean, 
  ): NotificationActionRecord {
    return NotificationActionRecord(identifier, buttonTitle, null,
      NotificationActionRecord.Options(opensToForeground))
  }

  private fun clearAllStoredCategories() {
    // Clear legacy storage using the new deleteAll method
    legacyStore.deleteAllNotificationCategories()
    
    // Clear SharedPreferences completely
    val sharedPrefs = context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
    sharedPrefs.edit().clear().commit()
  }

}