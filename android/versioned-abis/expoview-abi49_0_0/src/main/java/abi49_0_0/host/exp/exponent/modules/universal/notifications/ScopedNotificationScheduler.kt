package abi49_0_0.host.exp.exponent.modules.universal.notifications

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.ResultReceiver
import abi49_0_0.expo.modules.core.Promise
import abi49_0_0.expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import abi49_0_0.expo.modules.notifications.notifications.scheduling.NotificationScheduler
import abi49_0_0.expo.modules.notifications.service.NotificationsService
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.ScopedNotificationsUtils
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import host.exp.exponent.utils.ScopedContext
import java.util.*

class ScopedNotificationScheduler(context: Context, private val experienceKey: ExperienceKey) :
  NotificationScheduler(context) {
  private val scopedNotificationsUtils: ScopedNotificationsUtils = ScopedNotificationsUtils(context)

  override fun getSchedulingContext(): Context {
    return if (context is ScopedContext) {
      (context as ScopedContext).baseContext
    } else context
  }

  override fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    notificationTrigger: NotificationTrigger?
  ): NotificationRequest {
    return ScopedNotificationRequest(identifier, content, notificationTrigger, experienceKey.scopeKey)
  }

  override fun serializeScheduledNotificationRequests(requests: Collection<NotificationRequest>): Collection<Bundle> {
    val serializedRequests: MutableCollection<Bundle> = ArrayList(requests.size)
    for (request in requests) {
      if (scopedNotificationsUtils.shouldHandleNotification(request, experienceKey)) {
        serializedRequests.add(NotificationSerializer.toBundle(request))
      }
    }
    return serializedRequests
  }

  override fun cancelScheduledNotificationAsync(identifier: String, promise: Promise) {
    NotificationsService.getScheduledNotification(
      schedulingContext,
      identifier,
      object : ResultReceiver(HANDLER) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          super.onReceiveResult(resultCode, resultData)

          if (resultCode == NotificationsService.SUCCESS_CODE) {
            val request = when {
              Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> resultData?.getParcelable(NotificationsService.NOTIFICATION_REQUEST_KEY, ScopedNotificationRequest::class.java)
              else -> resultData?.getParcelable(NotificationsService.NOTIFICATION_REQUEST_KEY)
            }
            if (request == null || !scopedNotificationsUtils.shouldHandleNotification(request, experienceKey)) {
              promise.resolve(null)
              return
            }
            doCancelScheduledNotificationAsync(identifier, promise)
          } else {
            val e = resultData!!.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject(
              "ERR_NOTIFICATIONS_FAILED_TO_FETCH",
              "Failed to fetch scheduled notifications.",
              e
            )
          }
        }
      }
    )
  }

  override fun cancelAllScheduledNotificationsAsync(promise: Promise) {
    NotificationsService.getAllScheduledNotifications(
      schedulingContext,
      object : ResultReceiver(HANDLER) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          super.onReceiveResult(resultCode, resultData)

          if (resultCode == NotificationsService.SUCCESS_CODE) {
            val requests = resultData?.getParcelableArrayList<NotificationRequest>(
              NotificationsService.NOTIFICATION_REQUESTS_KEY
            )
            if (requests == null) {
              promise.resolve(null)
              return
            }

            val toRemove = mutableListOf<String>()
            for (request in requests) {
              if (scopedNotificationsUtils.shouldHandleNotification(request, experienceKey)) {
                toRemove.add(request.identifier)
              }
            }
            if (toRemove.size == 0) {
              promise.resolve(null)
              return
            }
            cancelSelectedNotificationsAsync(toRemove.toTypedArray(), promise)
          } else {
            val e = resultData!!.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject(
              "ERR_NOTIFICATIONS_FAILED_TO_CANCEL",
              "Failed to cancel all notifications.",
              e
            )
          }
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
      object : ResultReceiver(HANDLER) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          super.onReceiveResult(resultCode, resultData)

          if (resultCode == NotificationsService.SUCCESS_CODE) {
            promise.resolve(null)
          } else {
            val e = resultData!!.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject(
              "ERR_NOTIFICATIONS_FAILED_TO_CANCEL",
              "Failed to cancel all notifications.",
              e
            )
          }
        }
      }
    )
  }
}
