package expo.modules.notifications.notifications.presentation

import android.content.Context
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ResultReceiverBody
import expo.modules.notifications.createDefaultResultReceiver
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.dismiss
import expo.modules.notifications.service.NotificationsService.Companion.dismissAll
import expo.modules.notifications.service.NotificationsService.Companion.getAllPresented

open class ExpoNotificationPresentationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  protected fun createResultReceiver(body: ResultReceiverBody) =
    createDefaultResultReceiver(null, body)

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationPresenter")

    AsyncFunction("getPresentedNotificationsAsync") { promise: Promise ->
      getAllPresented(
        context,
        createResultReceiver { resultCode: Int, resultData: Bundle? ->
          val notifications = resultData?.getParcelableArrayList<Notification>(NotificationsService.NOTIFICATIONS_KEY)
          if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
            promise.resolve(serializeNotifications(notifications))
          } else {
            val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
            promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e)
          }
        }
      )
    }

    AsyncFunction("dismissNotificationAsync", this@ExpoNotificationPresentationModule::dismissNotificationAsync)

    AsyncFunction("dismissAllNotificationsAsync", this@ExpoNotificationPresentationModule::dismissAllNotificationsAsync)
  }

  protected open fun dismissNotificationAsync(identifier: String, promise: Promise) {
    dismiss(
      context,
      arrayOf(identifier),
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject("ERR_NOTIFICATION_DISMISSAL_FAILED", "Notification could not be dismissed.", e)
        }
      }
    )
  }

  protected open fun dismissAllNotificationsAsync(promise: Promise) {
    dismissAll(
      context,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject("ERR_NOTIFICATIONS_DISMISSAL_FAILED", "Notifications could not be dismissed.", e)
        }
      }
    )
  }

  protected open fun serializeNotifications(notifications: Collection<Notification>): List<Bundle> {
    return notifications.map(NotificationSerializer::toBundle)
  }
}
