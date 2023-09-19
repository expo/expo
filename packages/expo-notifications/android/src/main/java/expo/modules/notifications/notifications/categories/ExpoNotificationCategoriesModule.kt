package expo.modules.notifications.notifications.categories

import android.content.Context
import android.os.Bundle
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.arguments.MapArguments
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.notifications.ResultReceiverBody
import expo.modules.notifications.createDefaultResultReceiver
import expo.modules.notifications.notifications.categories.serializers.NotificationsCategoriesSerializer
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.deleteCategory
import expo.modules.notifications.service.NotificationsService.Companion.getCategories
import expo.modules.notifications.service.NotificationsService.Companion.setCategory

private const val EXPORTED_NAME = "ExpoNotificationCategoriesModule"
private const val IDENTIFIER_KEY = "identifier"
private const val BUTTON_TITLE_KEY = "buttonTitle"
private const val OPTIONS_KEY = "options"
private const val OPENS_APP_TO_FOREGROUND_KEY = "opensAppToForeground"
private const val TEXT_INPUT_OPTIONS_KEY = "textInput"
private const val PLACEHOLDER_KEY = "placeholder"

open class ExpoNotificationCategoriesModule(context: Context) : ExportedModule(context) {
  protected lateinit var serializer: NotificationsCategoriesSerializer

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    serializer = moduleRegistry.getModule(NotificationsCategoriesSerializer::class.java)
  }

  override fun getName(): String {
    return EXPORTED_NAME
  }

  private fun createResultReceiver(body: ResultReceiverBody) =
    createDefaultResultReceiver(null, body)

  @ExpoMethod
  open fun getNotificationCategoriesAsync(promise: Promise) {
    getCategories(
      context,
      createResultReceiver { resultCode: Int, resultData: Bundle ->
        val categories = resultData.getParcelableArrayList<NotificationCategory>(NotificationsService.NOTIFICATION_CATEGORIES_KEY)
        if (resultCode == NotificationsService.SUCCESS_CODE && categories != null) {
          promise.resolve(serializeCategories(categories))
        } else {
          promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.")
        }
      }
    )
  }

  @ExpoMethod
  open fun setNotificationCategoryAsync(
    identifier: String,
    actionArguments: List<Map<String, Any>>,
    categoryOptions: Map<String, Any>?,
    promise: Promise
  ) {
    val actions = mutableListOf<NotificationAction>()
    for (actionMap in actionArguments) {
      val actionParams = MapArguments(actionMap)
      val actionOptions = MapArguments(actionParams.getMap(OPTIONS_KEY, emptyMap<String, Any?>()) as Map<String, Any?>)
      val textInputOptions = if (actionParams.containsKey(TEXT_INPUT_OPTIONS_KEY)) {
        MapArguments(actionParams.getMap(TEXT_INPUT_OPTIONS_KEY) as Map<String, Any?>)
      } else {
        null
      }
      if (textInputOptions != null) {
        actions.add(
          TextInputNotificationAction(
            actionParams.getString(IDENTIFIER_KEY, null),
            actionParams.getString(BUTTON_TITLE_KEY, null),
            actionOptions.getBoolean(OPENS_APP_TO_FOREGROUND_KEY, true),
            textInputOptions.getString(PLACEHOLDER_KEY, null)
          )
        )
      } else {
        actions.add(
          NotificationAction(
            actionParams.getString(IDENTIFIER_KEY, null),
            actionParams.getString(BUTTON_TITLE_KEY, null),
            actionOptions.getBoolean(OPENS_APP_TO_FOREGROUND_KEY, true)
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
      createResultReceiver { resultCode: Int, resultData: Bundle ->
        val category = resultData.getParcelable<NotificationCategory>(NotificationsService.NOTIFICATION_CATEGORY_KEY)
        if (resultCode == NotificationsService.SUCCESS_CODE && category != null) {
          promise.resolve(serializer.toBundle(category))
        } else {
          promise.reject("ERR_CATEGORY_SET_FAILED", "The provided category could not be set.")
        }
      }
    )
  }

  @ExpoMethod
  open fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    deleteCategory(
      context,
      identifier,
      createResultReceiver { resultCode: Int, resultData: Bundle ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(resultData.getBoolean(NotificationsService.SUCCEEDED_KEY))
        } else {
          promise.reject("ERR_CATEGORY_DELETE_FAILED", "The category could not be deleted.")
        }
      }
    )
  }

  protected open fun serializeCategories(categories: Collection<NotificationCategory>): List<Bundle?> {
    return categories.map(serializer::toBundle)
  }
}
