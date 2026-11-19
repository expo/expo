package expo.modules.notifications.notifications.categories

import android.content.Context
import expo.modules.core.errors.InvalidArgumentException
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
      val categories = try {
        store.allNotificationCategories
      } catch (e: Exception) {
        promise.reject("ERR_CATEGORIES_FETCH_FAILED", "Could not fetch notification categories. Restart the app and try again.", e)
        return@AsyncFunction
      }
      promise.resolve(categories.filter { ownsCategory(it.identifier) }.map(::serializeCategory))
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
    try {
      store.saveNotificationCategory(category)
    } catch (e: InvalidArgumentException) {
      throw e
    } catch (e: Exception) {
      promise.reject("ERR_CATEGORY_SET_FAILED", "Could not save notification category '$identifier'. Check the available device storage and try again.", e)
      return
    }
    promise.resolve(serializeCategory(category))
  }

  open fun setNotificationCategoriesAsync(categories: List<NotificationCategoryRecord>, promise: Promise) {
    store.setNotificationCategories(categories, ::ownsCategory)
    promise.resolve(null)
  }

  open fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    val deleted = try {
      store.removeNotificationCategory(identifier)
    } catch (e: Exception) {
      promise.reject("ERR_CATEGORY_DELETE_FAILED", "Could not delete notification category '$identifier'. Check the available device storage and try again.", e)
      return
    }
    promise.resolve(deleted)
  }

  protected open fun ownsCategory(identifier: String): Boolean = true

  protected open fun serializeCategory(category: NotificationCategoryRecord): NotificationCategoryRecord = category
}
