package expo.modules.notifications.notifications.categories

import android.content.Context
import android.os.Bundle
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ModuleNotFoundException
import expo.modules.notifications.ResultReceiverBody
import expo.modules.notifications.createDefaultResultReceiver
import expo.modules.notifications.notifications.categories.serializers.NotificationsCategoriesSerializer
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.deleteCategory
import expo.modules.notifications.service.NotificationsService.Companion.setCategory
import expo.modules.notifications.service.delegates.HybridNotificationCategoriesStore
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore

// subclassed in Expo Go's ScopedExpoNotificationCategoriesModule.kt
open class ExpoNotificationCategoriesModule : Module() {

  protected val serializer by lazy {
    appContext.legacyModule<NotificationsCategoriesSerializer>()
      ?: throw ModuleNotFoundException(NotificationsCategoriesSerializer::class)
  }

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

  private fun createResultReceiver(body: ResultReceiverBody) =
    createDefaultResultReceiver(null, body)

  open fun setNotificationCategoryAsync(
    identifier: String,
    actionArguments: List<NotificationActionRecord>,
    categoryOptions: Map<String, Any?>?,
    promise: Promise
  ) {
    val actions = mutableListOf<NotificationAction>()
    for (actionMap in actionArguments) {
      val textInputOptions = actionMap.textInput
      if (textInputOptions != null) {
        actions.add(
          TextInputNotificationAction(
            actionMap.identifier,
            actionMap.buttonTitle,
            actionMap.options.opensAppToForeground,
            textInputOptions.placeholder
          )
        )
      } else {
        actions.add(
          NotificationAction(
            actionMap.identifier,
            actionMap.buttonTitle,
            actionMap.options.opensAppToForeground
          )
        )
      }
    }
    if (actions.isEmpty()) {
      throw InvalidArgumentException("Invalid arguments provided for notification category. Must provide at least one action.")
    }
    setCategory(
      context,
      NotificationCategory(identifier, actions),
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        val category = resultData?.getParcelable<NotificationCategory>(NotificationsService.NOTIFICATION_CATEGORY_KEY)
        if (resultCode == NotificationsService.SUCCESS_CODE && category != null) {
          promise.resolve(serializer.toBundle(category))
        } else {
          promise.reject("ERR_CATEGORY_SET_FAILED", "The provided category could not be set.", null)
        }
      }
    )
  }

  open fun setNotificationCategoriesAsync(categories: List<NotificationCategoryRecord>, promise: Promise) {
    hybridStore.setBulkCategories(categories)
    promise.resolve()
  }

  open fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    deleteCategory(
      context,
      identifier,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(resultData?.getBoolean(NotificationsService.SUCCEEDED_KEY))
        } else {
          promise.reject("ERR_CATEGORY_DELETE_FAILED", "The category could not be deleted.", null)
        }
      }
    )
  }

  open fun filterCategories(categories: Collection<NotificationCategoryRecord>): Collection<NotificationCategoryRecord> {
    // to be used by expo go
    return categories
  }

}
