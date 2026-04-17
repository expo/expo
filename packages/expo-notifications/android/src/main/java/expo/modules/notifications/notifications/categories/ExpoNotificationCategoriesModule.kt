package expo.modules.notifications.notifications.categories

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.service.delegates.HybridNotificationCategoriesStore
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore

// subclassed in Expo Go's ScopedExpoNotificationCategoriesModule.kt
open class ExpoNotificationCategoriesModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val hybridStore by lazy {
    HybridNotificationCategoriesStore(context, SharedPreferencesNotificationCategoriesStore(context))
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("setNotificationCategoriesAsync", this@ExpoNotificationCategoriesModule::setNotificationCategoriesAsync)

    AsyncFunction("getNotificationCategoriesAsync") { promise: Promise ->
      val categories = hybridStore.getAllCategories()
      promise.resolve(filterCategories(categories).toList())
    }

    AsyncFunction("setNotificationCategoryAsync", this@ExpoNotificationCategoriesModule::setNotificationCategoryAsync)

    AsyncFunction("deleteNotificationCategoryAsync", this@ExpoNotificationCategoriesModule::deleteNotificationCategoryAsync)
  }

  open fun setNotificationCategoryAsync(
    identifier: String,
    actionArguments: List<NotificationActionRecord>,
    categoryOptions: Map<String, Any?>?,
    promise: Promise
  ) {
    val category = NotificationCategoryRecord(identifier, actionArguments)
    hybridStore.saveCategory(category)
    promise.resolve(category)
  }

  open fun setNotificationCategoriesAsync(categories: List<NotificationCategoryRecord>, promise: Promise) {
    hybridStore.setBulkCategories(categories)
    promise.resolve(categories)
  }

  open fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    val deleted = hybridStore.deleteCategory(identifier)
    promise.resolve(deleted)
  }

  open fun filterCategories(categories: Collection<NotificationCategoryRecord>): Collection<NotificationCategoryRecord> {
    // to be used by expo go
    return categories
  }
}
