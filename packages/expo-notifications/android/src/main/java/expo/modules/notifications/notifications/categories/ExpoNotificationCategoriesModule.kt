package expo.modules.notifications.notifications.categories

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore

// subclassed in Expo Go's ScopedExpoNotificationCategoriesModule.kt
open class ExpoNotificationCategoriesModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val store by lazy { SharedPreferencesNotificationCategoriesStore(context) }

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationCategoriesModule")

    AsyncFunction("setNotificationCategoriesAsync", this@ExpoNotificationCategoriesModule::setNotificationCategoriesAsync)

    AsyncFunction("getNotificationCategoriesAsync") { promise: Promise ->
      promise.resolve(store.allNotificationCategories.filter { ownsCategory(it.identifier) }.map(::serializeCategory))
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
    store.saveNotificationCategory(category)
    promise.resolve(serializeCategory(category))
  }

  open fun setNotificationCategoriesAsync(categories: List<NotificationCategoryRecord>, promise: Promise) {
    store.setNotificationCategories(categories, ::ownsCategory)
    promise.resolve(null)
  }

  open fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    val deleted = store.removeNotificationCategory(identifier)
    promise.resolve(deleted)
  }

  protected open fun ownsCategory(identifier: String): Boolean = true

  protected open fun serializeCategory(category: NotificationCategoryRecord): NotificationCategoryRecord = category
}
