package expo.modules.notifications.service.delegates

import android.app.AlarmManager
import android.content.Context
import android.util.Log
import androidx.core.app.AlarmManagerCompat
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.SchedulingDelegate
import java.io.IOException
import java.io.InvalidClassException

class ExpoSchedulingDelegate(protected val context: Context) : SchedulingDelegate {
  protected val store = SharedPreferencesNotificationsStore(context)
  protected val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  override fun setupScheduledNotifications() {
    store.allNotificationRequests.forEach {
      try {
        scheduleNotification(it)
      } catch (e: Exception) {
        Log.w("expo-notifications", "Notification ${it.identifier} could not have been scheduled: ${e.message}")
        e.printStackTrace()
      }
    }
  }

  override fun getAllScheduledNotifications(): Collection<NotificationRequest> =
    store.allNotificationRequests

  override fun getScheduledNotification(identifier: String): NotificationRequest? = try {
    store.getNotificationRequest(identifier)
  } catch (e: IOException) {
    null
  } catch (e: ClassNotFoundException) {
    null
  } catch (e: NullPointerException) {
    null
  }

  override fun scheduleNotification(request: NotificationRequest) {
    // If the trigger is empty, handle receive immediately and return.
    if (request.trigger == null) {
      NotificationsService.receive(context, Notification(request))
      return
    }

    if (request.trigger !is SchedulableNotificationTrigger) {
      throw IllegalArgumentException("Notification request \"${request.identifier}\" does not have a schedulable trigger (it's ${request.trigger}). Refusing to schedule.")
    }

    (request.trigger as SchedulableNotificationTrigger).nextTriggerDate().let { nextTriggerDate ->
      if (nextTriggerDate == null) {
        Log.d("expo-notifications", "Notification request \"${request.identifier}\" will not trigger in the future, removing.")
        NotificationsService.removeScheduledNotification(context, request.identifier)
      } else {
        store.saveNotificationRequest(request)
        AlarmManagerCompat.setExactAndAllowWhileIdle(
          alarmManager,
          AlarmManager.RTC_WAKEUP,
          nextTriggerDate.time,
          NotificationsService.createNotificationTrigger(context, request.identifier)
        )
      }
    }
  }

  override fun triggerNotification(identifier: String) {
    try {
      val notificationRequest: NotificationRequest = store.getNotificationRequest(identifier)!!
      NotificationsService.receive(context, Notification(notificationRequest))
      NotificationsService.schedule(context, notificationRequest)
    } catch (e: ClassNotFoundException) {
      Log.e("expo-notifications", "An exception occurred while triggering notification " + identifier + ", removing. " + e.message)
      e.printStackTrace()
      NotificationsService.removeScheduledNotification(context, identifier)
    } catch (e: InvalidClassException) {
      Log.e("expo-notifications", "An exception occurred while triggering notification " + identifier + ", removing. " + e.message)
      e.printStackTrace()
      NotificationsService.removeScheduledNotification(context, identifier)
    } catch (e: NullPointerException) {
      Log.e("expo-notifications", "An exception occurred while triggering notification " + identifier + ", removing. " + e.message)
      e.printStackTrace()
      NotificationsService.removeScheduledNotification(context, identifier)
    }
  }

  override fun removeScheduledNotifications(identifiers: Collection<String>) {
    identifiers.forEach {
      alarmManager.cancel(NotificationsService.createNotificationTrigger(context, it))
      store.removeNotificationRequest(it)
    }
  }

  override fun removeAllScheduledNotifications() {
    store.removeAllNotificationRequests().forEach {
      alarmManager.cancel(NotificationsService.createNotificationTrigger(context, it))
    }
  }
}
