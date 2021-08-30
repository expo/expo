package expo.modules.notifications.notifications.scheduling;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ResultReceiver;

import expo.modules.core.ExportedModule;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.errors.InvalidArgumentException;
import expo.modules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.triggers.ChannelAwareTrigger;
import expo.modules.notifications.notifications.triggers.DailyTrigger;
import expo.modules.notifications.notifications.triggers.DateTrigger;
import expo.modules.notifications.notifications.triggers.TimeIntervalTrigger;
import expo.modules.notifications.notifications.triggers.WeeklyTrigger;
import expo.modules.notifications.notifications.triggers.YearlyTrigger;
import expo.modules.notifications.service.NotificationsService;

public class NotificationScheduler extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationScheduler";

  protected static Handler HANDLER = new Handler(Looper.getMainLooper());

  public NotificationScheduler(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  protected Context getSchedulingContext() {
    return getContext();
  }

  @ExpoMethod
  public void getAllScheduledNotificationsAsync(final Promise promise) {
    NotificationsService.Companion.getAllScheduledNotifications(getSchedulingContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          Collection<NotificationRequest> requests = resultData.getParcelableArrayList(NotificationsService.NOTIFICATION_REQUESTS_KEY);
          if (requests == null) {
            promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.");
          } else {
            promise.resolve(serializeScheduledNotificationRequests(requests));
          }
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void scheduleNotificationAsync(final String identifier, ReadableArguments notificationContentMap, ReadableArguments triggerParams, final Promise promise) {
    try {
      NotificationContent content = new ArgumentsNotificationContentBuilder(getContext()).setPayload(notificationContentMap).build();
      NotificationRequest request = createNotificationRequest(identifier, content, triggerFromParams(triggerParams));
      NotificationsService.Companion.schedule(getSchedulingContext(), request, new ResultReceiver(HANDLER) {
          @Override
          protected void onReceiveResult(int resultCode, Bundle resultData) {
            super.onReceiveResult(resultCode, resultData);
            if (resultCode == NotificationsService.SUCCESS_CODE) {
              promise.resolve(identifier);
            } else {
              Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
              if (e == null) {
                promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule notification.");
              } else {
                promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule the notification. " + e.getMessage(), e);
              }
            }
          }
        });
    } catch (InvalidArgumentException e) {
      promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule the notification. " + e.getMessage(), e);
    } catch (NullPointerException e) {
      promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule the notification. Encountered unexpected null value. " + e.getMessage(), e);
    }
  }

  @ExpoMethod
  public void cancelScheduledNotificationAsync(String identifier, final Promise promise) {
    NotificationsService.Companion.removeScheduledNotification(getSchedulingContext(), identifier, new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel notification.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void cancelAllScheduledNotificationsAsync(final Promise promise) {
    NotificationsService.Companion.removeAllScheduledNotifications(getSchedulingContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel all notifications.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void getNextTriggerDateAsync(ReadableArguments triggerParams, Promise promise) {
    try {
      NotificationTrigger trigger = triggerFromParams(triggerParams);
      if (trigger instanceof SchedulableNotificationTrigger) {
        Date nextTriggerDate = ((SchedulableNotificationTrigger) trigger).nextTriggerDate();
        if (nextTriggerDate == null) {
          promise.resolve(null);
        } else {
          promise.resolve((double) (nextTriggerDate.getTime()));
        }
      } else {
        String triggerDescription = trigger == null ? "null" : trigger.getClass().getName();
        String message = String.format("It is not possible to get next trigger date for triggers other than calendar-based. Provided trigger resulted in %s trigger.", triggerDescription);
        promise.reject("ERR_NOTIFICATIONS_INVALID_CALENDAR_TRIGGER", message);
      }
    } catch (InvalidArgumentException e) {
      promise.reject("ERR_NOTIFICATIONS_FAILED_TO_GET_NEXT_TRIGGER_DATE", "Failed to get next trigger date for the trigger. " + e.getMessage(), e);
    } catch (NullPointerException e) {
      promise.reject("ERR_NOTIFICATIONS_FAILED_TO_GET_NEXT_TRIGGER_DATE", "Failed to get next trigger date for the trigger. Encountered unexpected null value. " + e.getMessage(), e);
    }
  }

  @Nullable
  protected NotificationTrigger triggerFromParams(@Nullable ReadableArguments params) throws InvalidArgumentException {
    if (params == null) {
      return null;
    }

    String channelId = params.getString("channelId", null);
    switch (params.getString("type")) {
      case "timeInterval":
        if (!(params.get("seconds") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value provided as interval of trigger.");
        }
        return new TimeIntervalTrigger(((Number) params.get("seconds")).longValue(), params.getBoolean("repeats"), channelId);
      case "date":
        if (!(params.get("timestamp") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value provided as date of trigger.");
        }
        return new DateTrigger(((Number) params.get("timestamp")).longValue(), channelId);
      case "daily":
        if (!(params.get("hour") instanceof Number) || !(params.get("minute") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value(s) provided for daily trigger.");
        }
        return new DailyTrigger(
          ((Number) params.get("hour")).intValue(),
          ((Number) params.get("minute")).intValue(),
          channelId
        );
      case "weekly":
        if (!(params.get("weekday") instanceof Number) || !(params.get("hour") instanceof Number) || !(params.get("minute") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value(s) provided for weekly trigger.");
        }
        return new WeeklyTrigger(
          ((Number) params.get("weekday")).intValue(),
          ((Number) params.get("hour")).intValue(),
          ((Number) params.get("minute")).intValue(),
          channelId
        );
      case "yearly":
        if (!(params.get("day") instanceof Number) || !(params.get("month") instanceof Number) || !(params.get("hour") instanceof Number) || !(params.get("minute") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value(s) provided for yearly trigger.");
        }
        return new YearlyTrigger(
          ((Number) params.get("day")).intValue(),
          ((Number) params.get("month")).intValue(),
          ((Number) params.get("hour")).intValue(),
          ((Number) params.get("minute")).intValue(),
          channelId
        );
      case "channel":
        return new ChannelAwareTrigger(channelId);
      default:
        throw new InvalidArgumentException("Trigger of type: " + params.getString("type") + " is not supported on Android.");
    }
  }

  protected NotificationRequest createNotificationRequest(String identifier, NotificationContent content, NotificationTrigger notificationTrigger) {
    return new NotificationRequest(identifier, content, notificationTrigger);
  }

  protected Collection<Bundle> serializeScheduledNotificationRequests(Collection<NotificationRequest> requests) {
    Collection<Bundle> serializedRequests = new ArrayList<>(requests.size());
    for (NotificationRequest request : requests) {
      serializedRequests.add(NotificationSerializer.toBundle(request));
    }
    return serializedRequests;
  }
}
