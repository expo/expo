package expo.modules.notifications.notifications.scheduling

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ResultReceiverBody
import expo.modules.notifications.createDefaultResultReceiver
import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.triggers.ChannelAwareTrigger
import expo.modules.notifications.notifications.triggers.DailyTrigger
import expo.modules.notifications.notifications.triggers.DateTrigger
import expo.modules.notifications.notifications.triggers.MonthlyTrigger
import expo.modules.notifications.notifications.triggers.TimeIntervalTrigger
import expo.modules.notifications.notifications.triggers.WeeklyTrigger
import expo.modules.notifications.notifications.triggers.YearlyTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.getAllScheduledNotifications
import expo.modules.notifications.service.NotificationsService.Companion.removeAllScheduledNotifications
import expo.modules.notifications.service.NotificationsService.Companion.removeScheduledNotification
import expo.modules.notifications.service.NotificationsService.Companion.schedule

open class NotificationScheduler : Module() {
  protected open val schedulingContext: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val handler = Handler(Looper.getMainLooper())

  protected fun createResultReceiver(body: ResultReceiverBody) =
    createDefaultResultReceiver(handler, body)

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationScheduler")

    AsyncFunction("getAllScheduledNotificationsAsync") { promise: Promise ->
      getAllScheduledNotifications(
        schedulingContext,
        createResultReceiver { resultCode: Int, resultData: Bundle? ->
          if (resultCode == NotificationsService.SUCCESS_CODE) {
            val requests = resultData?.getParcelableArrayList<NotificationRequest>(NotificationsService.NOTIFICATION_REQUESTS_KEY)
            if (requests == null) {
              promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.", null)
            } else {
              promise.resolve(serializeScheduledNotificationRequests(requests))
            }
          } else {
            val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as Exception
            promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.", e)
          }
        }
      )
    }

    AsyncFunction("scheduleNotificationAsync") { identifier: String, notificationContentMap: ReadableArguments, triggerParams: ReadableArguments?, promise: Promise ->
      try {
        val content = ArgumentsNotificationContentBuilder(schedulingContext).setPayload(notificationContentMap).build()
        val request = createNotificationRequest(
          identifier,
          content,
          triggerFromParams(triggerParams)
        )

        schedule(
          schedulingContext,
          request,
          createResultReceiver { resultCode: Int, resultData: Bundle? ->
            if (resultCode == NotificationsService.SUCCESS_CODE) {
              promise.resolve(identifier)
            } else {
              val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
              promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule the notification. ${e?.message}", e)
            }
          }
        )
      } catch (e: InvalidArgumentException) {
        promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule the notification. ${e.message}", e)
      } catch (e: NullPointerException) {
        promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule the notification. Encountered unexpected null value. ${e.message}", e)
      }
    }

    AsyncFunction("cancelScheduledNotificationAsync", this@NotificationScheduler::cancelScheduledNotificationAsync)

    AsyncFunction("cancelAllScheduledNotificationsAsync", this@NotificationScheduler::cancelAllScheduledNotificationsAsync)

    AsyncFunction("getNextTriggerDateAsync") { triggerParams: ReadableArguments?, promise: Promise ->
      try {
        val trigger = triggerFromParams(triggerParams)
        if (trigger is SchedulableNotificationTrigger) {
          val nextTriggerDate = trigger.nextTriggerDate()
          if (nextTriggerDate == null) {
            promise.resolve(null)
          } else {
            promise.resolve(nextTriggerDate.time.toDouble())
          }
        } else {
          val triggerDescription = if (trigger == null) "null" else trigger.javaClass.name
          val message = String.format("It is not possible to get next trigger date for triggers other than calendar-based. Provided trigger resulted in %s trigger.", triggerDescription)
          promise.reject("ERR_NOTIFICATIONS_INVALID_CALENDAR_TRIGGER", message, null)
        }
      } catch (e: InvalidArgumentException) {
        promise.reject("ERR_NOTIFICATIONS_FAILED_TO_GET_NEXT_TRIGGER_DATE", "Failed to get next trigger date for the trigger. ${e.message}", e)
      } catch (e: NullPointerException) {
        promise.reject("ERR_NOTIFICATIONS_FAILED_TO_GET_NEXT_TRIGGER_DATE", "Failed to get next trigger date for the trigger. Encountered unexpected null value. ${e.message}", e)
      }
    }
  }

  open fun cancelScheduledNotificationAsync(identifier: String, promise: Promise) {
    removeScheduledNotification(
      schedulingContext,
      identifier,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel notification.", e)
        }
      }
    )
  }

  open fun cancelAllScheduledNotificationsAsync(promise: Promise) {
    removeAllScheduledNotifications(
      schedulingContext,
      createResultReceiver { resultCode: Int, resultData: Bundle? ->
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null)
        } else {
          val e = resultData?.getSerializable(NotificationsService.EXCEPTION_KEY) as? Exception
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel all notifications.", e)
        }
      }
    )
  }

  @Throws(InvalidArgumentException::class)
  protected fun triggerFromParams(params: ReadableArguments?): NotificationTrigger? {
    if (params == null) {
      return null
    }
    val channelId = params.getString("channelId", null)
    return when (val type = params.getString("type")) {
      "timeInterval" -> {
        val seconds = params["seconds"] as? Number
          ?: throw InvalidArgumentException("Invalid value provided as interval of trigger.")

        TimeIntervalTrigger(channelId, seconds.toLong(), params.getBoolean("repeats"))
      }

      "date" -> {
        val timestamp = params["timestamp"] as? Number
          ?: throw InvalidArgumentException("Invalid value provided as date of trigger.")

        DateTrigger(channelId, timestamp.toLong())
      }

      "daily" -> {
        val hour = params["hour"] as? Number
        val minute = params["minute"] as? Number

        if (hour == null || minute == null) {
          throw InvalidArgumentException("Invalid value(s) provided for daily trigger.")
        }

        DailyTrigger(
          channelId,
          hour.toInt(),
          minute.toInt()
        )
      }

      "weekly" -> {
        val weekday = params["weekday"] as? Number
        val hour = params["hour"] as? Number
        val minute = params["minute"] as? Number

        if (weekday == null || hour == null || minute == null) {
          throw InvalidArgumentException("Invalid value(s) provided for weekly trigger.")
        }
        WeeklyTrigger(
          channelId,
          weekday.toInt(),
          hour.toInt(),
          minute.toInt()
        )
      }

      "monthly" -> {
        val day = params["day"] as? Number
        val hour = params["hour"] as? Number
        val minute = params["minute"] as? Number

        if (day == null || hour == null || minute == null) {
          throw InvalidArgumentException("Invalid value(s) provided for yearly trigger.")
        }

        MonthlyTrigger(
          channelId,
          day.toInt(),
          hour.toInt(),
          minute.toInt()
        )
      }

      "yearly" -> {
        val day = params["day"] as? Number
        val month = params["month"] as? Number
        val hour = params["hour"] as? Number
        val minute = params["minute"] as? Number

        if (day == null || month == null || hour == null || minute == null) {
          throw InvalidArgumentException("Invalid value(s) provided for yearly trigger.")
        }

        YearlyTrigger(
          channelId,
          day.toInt(),
          month.toInt(),
          hour.toInt(),
          minute.toInt()
        )
      }

      "channel" -> ChannelAwareTrigger(channelId)
      else -> throw InvalidArgumentException("Trigger of type: $type is not supported on Android.")
    }
  }

  protected open fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    notificationTrigger: NotificationTrigger?
  ): NotificationRequest {
    return NotificationRequest(identifier, content, notificationTrigger)
  }

  protected open fun serializeScheduledNotificationRequests(requests: Collection<NotificationRequest>): List<Bundle> {
    return requests.map(NotificationSerializer::toBundle)
  }
}
