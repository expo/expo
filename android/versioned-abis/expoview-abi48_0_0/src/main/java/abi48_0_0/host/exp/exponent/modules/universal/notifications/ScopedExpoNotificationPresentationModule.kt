package abi48_0_0.host.exp.exponent.modules.universal.notifications

import android.content.Context
import android.os.Bundle
import android.os.ResultReceiver
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import abi48_0_0.expo.modules.notifications.notifications.presentation.ExpoNotificationPresentationModule
import abi48_0_0.expo.modules.notifications.service.NotificationsService
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.ScopedNotificationsUtils
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import java.util.*

class ScopedExpoNotificationPresentationModule(
  context: Context,
  private val experienceKey: ExperienceKey
) : ExpoNotificationPresentationModule(context) {
  private val scopedNotificationsUtils: ScopedNotificationsUtils = ScopedNotificationsUtils(context)

  override fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    trigger: NotificationTrigger?
  ): NotificationRequest {
    return ScopedNotificationRequest(identifier, content, trigger, experienceKey.scopeKey)
  }

  override fun serializeNotifications(notifications: Collection<Notification>): ArrayList<Bundle> {
    val serializedNotifications = arrayListOf<Bundle>()
    for (notification in notifications) {
      if (scopedNotificationsUtils.shouldHandleNotification(notification, experienceKey)) {
        serializedNotifications.add(NotificationSerializer.toBundle(notification))
      }
    }
    return serializedNotifications
  }

  override fun dismissNotificationAsync(identifier: String, promise: Promise) {
    NotificationsService.getAllPresented(
      context,
      object : ResultReceiver(null) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          super.onReceiveResult(resultCode, resultData)
          val notifications = resultData?.getParcelableArrayList<Notification>(
            NotificationsService.NOTIFICATIONS_KEY
          )
          if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
            val notification = findNotification(notifications, identifier)
            if (notification == null || !scopedNotificationsUtils.shouldHandleNotification(notification, experienceKey)) {
              promise.resolve(null)
              return
            }
            doDismissNotificationAsync(identifier, promise)
          } else {
            val e = resultData!!.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject(
              "ERR_NOTIFICATIONS_FETCH_FAILED",
              "A list of displayed notifications could not be fetched.",
              e
            )
          }
        }
      }
    )
  }

  override fun dismissAllNotificationsAsync(promise: Promise) {
    NotificationsService.getAllPresented(
      context,
      object : ResultReceiver(null) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          super.onReceiveResult(resultCode, resultData)

          val notifications = resultData?.getParcelableArrayList<Notification>(
            NotificationsService.NOTIFICATIONS_KEY
          )
          if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
            val toDismiss = mutableListOf<String>()
            for (notification in notifications) {
              if (scopedNotificationsUtils.shouldHandleNotification(notification, experienceKey)) {
                toDismiss.add(notification.notificationRequest.identifier)
              }
            }
            dismissSelectedAsync(toDismiss.toTypedArray(), promise)
          } else {
            val e = resultData!!.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject(
              "ERR_NOTIFICATIONS_FETCH_FAILED",
              "A list of displayed notifications could not be fetched.",
              e
            )
          }
        }
      }
    )
  }

  private fun doDismissNotificationAsync(identifier: String, promise: Promise) {
    super.dismissNotificationAsync(identifier, promise)
  }

  private fun dismissSelectedAsync(identifiers: Array<String>, promise: Promise) {
    NotificationsService.dismiss(
      context,
      identifiers,
      object : ResultReceiver(null) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          super.onReceiveResult(resultCode, resultData)

          if (resultCode == NotificationsService.SUCCESS_CODE) {
            promise.resolve(null)
          } else {
            val e = resultData!!.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject(
              "ERR_NOTIFICATIONS_DISMISSAL_FAILED",
              "Notifications could not be dismissed.",
              e
            )
          }
        }
      }
    )
  }

  private fun findNotification(notifications: Collection<Notification>, identifier: String): Notification? {
    return notifications.find { it.notificationRequest.identifier == identifier }
  }
}
