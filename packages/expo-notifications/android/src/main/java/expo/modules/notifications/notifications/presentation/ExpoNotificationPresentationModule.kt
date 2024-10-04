package expo.modules.notifications.notifications.presentation

import android.content.Context
import android.os.Bundle
import expo.modules.core.arguments.ReadableArguments
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ResultReceiverBody
import expo.modules.notifications.createDefaultResultReceiver
import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.dismiss
import expo.modules.notifications.service.NotificationsService.Companion.dismissAll
import expo.modules.notifications.service.NotificationsService.Companion.getAllPresented
import expo.modules.notifications.service.NotificationsService.Companion.present

open class ExpoNotificationPresentationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  protected fun createResultReceiver(body: ResultReceiverBody) =
    createDefaultResultReceiver(null, body)

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationPresenter")

    AsyncFunction("presentNotificationAsync") { identifier: String, payload: ReadableArguments, promise: Promise ->
      val content = ArgumentsNotificationContentBuilder(context).setPayload(payload).build()
      val request = createNotificationRequest(identifier, content, null)
      val notification = Notification(request)
      present(
        context,
        notification,
        null,
        createResultReceiver { resultCode: Int, resultData: Bundle? ->
          if (resultCode == NotificationsService.SUCCESS_CODE) {
            promise.resolve(identifier)
          } else {
            val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
            promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", "Notification could not be presented.", e)
          }
        }
      )
    }

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

  protected open fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    trigger: NotificationTrigger?
  ): NotificationRequest {
    return NotificationRequest(identifier, content, null)
  }

  protected open fun serializeNotifications(notifications: Collection<Notification>): List<Bundle> {
    return notifications.map(NotificationSerializer::toBundle)
  }
}
