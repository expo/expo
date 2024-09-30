package versioned.host.exp.exponent.modules.universal.notifications

import android.content.Context
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.presentation.ExpoNotificationPresentationModule
import expo.modules.notifications.service.NotificationsService
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.ScopedNotificationsUtils
import host.exp.exponent.notifications.model.ScopedNotificationRequest

class ScopedExpoNotificationPresentationModule(
  private val context: Context,
  private val experienceKey: ExperienceKey
) : ExpoNotificationPresentationModule() {
  private val scopedNotificationsUtils = ScopedNotificationsUtils(context)

  override fun createNotificationRequest(
    identifier: String,
    content: INotificationContent,
    trigger: NotificationTrigger?
  ): NotificationRequest {
    return ScopedNotificationRequest(identifier, content, trigger, experienceKey.scopeKey)
  }

  override fun serializeNotifications(notifications: Collection<Notification>): List<Bundle> {
    return notifications
      .filter { scopedNotificationsUtils.shouldHandleNotification(it, experienceKey) }
      .map(NotificationSerializer::toBundle)
  }

  override fun dismissNotificationAsync(identifier: String, promise: Promise) {
    NotificationsService.getAllPresented(
      context,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        val notifications = resultData?.getParcelableArrayList<Notification>(
          NotificationsService.NOTIFICATIONS_KEY
        )
        if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
          val notification = findNotification(notifications, identifier)
          if (notification == null || !scopedNotificationsUtils.shouldHandleNotification(notification, experienceKey)) {
            promise.resolve(null)
            return@createResultReceiver
          }
          super.dismissNotificationAsync(identifier, promise)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject(
            "ERR_NOTIFICATIONS_FETCH_FAILED",
            "A list of displayed notifications could not be fetched.",
            e
          )
        }
      }
    )
  }

  override fun dismissAllNotificationsAsync(promise: Promise) {
    NotificationsService.getAllPresented(
      context,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        val notifications = resultData?.getParcelableArrayList<Notification>(
          NotificationsService.NOTIFICATIONS_KEY
        )
        if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
          val toDismiss = notifications
            .filter { scopedNotificationsUtils.shouldHandleNotification(it, experienceKey) }
            .map { it.notificationRequest.identifier }
          dismissSelectedAsync(toDismiss.toTypedArray(), promise)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject(
            "ERR_NOTIFICATIONS_FETCH_FAILED",
            "A list of displayed notifications could not be fetched.",
            e
          )
        }
      }
    )
  }

  private fun dismissSelectedAsync(identifiers: Array<String>, promise: Promise) {
    NotificationsService.dismiss(
      context,
      identifiers,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject(
            "ERR_NOTIFICATIONS_DISMISSAL_FAILED",
            "Notifications could not be dismissed.",
            e
          )
        }
      }
    )
  }

  private fun findNotification(notifications: Collection<Notification>, identifier: String): Notification? {
    return notifications.find { it.notificationRequest.identifier == identifier }
  }
}
