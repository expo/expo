package host.exp.exponent.notifications.delegates

import android.content.Context
import android.os.Parcel
import android.service.notification.StatusBarNotification
import android.util.Log
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import host.exp.exponent.notifications.ScopedCategoryAwareNotificationBuilder
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import java.util.*

class ScopedExpoPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  override suspend fun createNotification(notification: Notification, notificationBehavior: NotificationBehavior?): android.app.Notification =
    ScopedCategoryAwareNotificationBuilder(context, notification, SharedPreferencesNotificationCategoriesStore(context)).also {
      it.setAllowedBehavior(notificationBehavior)
    }.build()

  override fun getNotification(statusBarNotification: StatusBarNotification): Notification? {
    statusBarNotification.notification.extras.getByteArray(ExpoNotificationBuilder.EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY)?.let {
      try {
        with(Parcel.obtain()) {
          unmarshall(it, 0, it.size)
          setDataPosition(0)
          val request: ScopedNotificationRequest = ScopedNotificationRequest.CREATOR.createFromParcel(this)
          recycle()
          val notificationDate = Date(statusBarNotification.postTime)
          return Notification(request, notificationDate)
        }
      } catch (e: Exception) {
        // Let's catch all the exceptions -- there's nothing we can do here
        // and we'd rather return an array with a single, naively reconstructed notification
        // than throw an exception and return none.
        val message = "Could not have unmarshalled ScopedNotificationRequest from (${statusBarNotification.tag}, ${statusBarNotification.id})."
        Log.e("expo-notifications", message)
      }
    }
    return super.getNotification(statusBarNotification)
  }

  /**
   * Prevent notifications of different experiences overwriting each other in Expo Go.
   * The notification is either a remote notification sent through Expo's push
   * service, or a local notification.
   */
  override fun getNotifyId(request: NotificationRequest?): Int {
    if (request == null) {
      return super.getNotifyId(request)
    }
    val experienceId = if (request.trigger is FirebaseNotificationTrigger) {
      (request.trigger as FirebaseNotificationTrigger).getRemoteMessage().data["scopeKey"]
    } else if (request is ScopedNotificationRequest) {
      request.experienceScopeKeyString
    } else {
      ""
    }
    return experienceId.hashCode()
  }
}
