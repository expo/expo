package versioned.host.exp.exponent.modules.universal.notifications

import android.content.Context
import android.os.Build
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.scheduling.NotificationScheduler
import expo.modules.notifications.service.NotificationsService
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.ScopedNotificationsUtils
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import host.exp.exponent.utils.ScopedContext

class ScopedNotificationScheduler(private val context: Context, private val experienceKey: ExperienceKey) :
  NotificationScheduler() {
  private val scopedNotificationsUtils: ScopedNotificationsUtils = ScopedNotificationsUtils(context)

  override val schedulingContext: Context
    get() = if (context is ScopedContext) {
      context.baseContext
    } else {
      context
    }

  override fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    notificationTrigger: NotificationTrigger?
  ): NotificationRequest {
    return ScopedNotificationRequest(identifier, content, notificationTrigger, experienceKey.scopeKey)
  }

  override fun serializeScheduledNotificationRequests(requests: Collection<NotificationRequest>): List<Bundle> {
    return requests
      .filter { scopedNotificationsUtils.shouldHandleNotification(it, experienceKey) }
      .map(NotificationSerializer::toBundle)
  }

  override fun cancelScheduledNotificationAsync(identifier: String, promise: Promise) {
    NotificationsService.getScheduledNotification(
      schedulingContext,
      identifier,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          val request = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> resultData?.getParcelable(NotificationsService.NOTIFICATION_REQUEST_KEY, ScopedNotificationRequest::class.java)
            else -> resultData?.getParcelable(NotificationsService.NOTIFICATION_REQUEST_KEY)
          }
          if (request == null || !scopedNotificationsUtils.shouldHandleNotification(request, experienceKey)) {
            promise.resolve(null)
            return@createResultReceiver
          }
          doCancelScheduledNotificationAsync(identifier, promise)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject(
            "ERR_NOTIFICATIONS_FAILED_TO_FETCH",
            "Failed to fetch scheduled notifications.",
            e
          )
        }
      }
    )
  }

  override fun cancelAllScheduledNotificationsAsync(promise: Promise) {
    NotificationsService.getAllScheduledNotifications(
      schedulingContext,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          val requests = resultData?.getParcelableArrayList<NotificationRequest>(
            NotificationsService.NOTIFICATION_REQUESTS_KEY
          )
          if (requests == null) {
            promise.resolve(null)
            return@createResultReceiver
          }

          val toRemove = mutableListOf<String>()
          for (request in requests) {
            if (scopedNotificationsUtils.shouldHandleNotification(request, experienceKey)) {
              toRemove.add(request.identifier)
            }
          }
          if (toRemove.size == 0) {
            promise.resolve(null)
            return@createResultReceiver
          }
          cancelSelectedNotificationsAsync(toRemove.toTypedArray(), promise)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject(
            "ERR_NOTIFICATIONS_FAILED_TO_CANCEL",
            "Failed to cancel all notifications.",
            e
          )
        }
      }
    )
  }

  private fun doCancelScheduledNotificationAsync(identifier: String, promise: Promise) {
    super.cancelScheduledNotificationAsync(identifier, promise)
  }

  private fun cancelSelectedNotificationsAsync(identifiers: Array<String>, promise: Promise) {
    NotificationsService.removeScheduledNotifications(
      schedulingContext,
      identifiers.toList(),
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject(
            "ERR_NOTIFICATIONS_FAILED_TO_CANCEL",
            "Failed to cancel all notifications.",
            e
          )
        }
      }
    )
  }
}
