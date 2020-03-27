package expo.modules.notifications.notifications.scheduling;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ResultReceiver;

import org.json.JSONObject;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.errors.InvalidArgumentException;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.JSONNotificationContentBuilder;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.service.ExpoNotificationSchedulerService;
import expo.modules.notifications.notifications.triggers.DateTrigger;
import expo.modules.notifications.notifications.triggers.TimeIntervalTrigger;

public class NotificationScheduler extends ExportedModule {
  private final static String EXPORTED_NAME = "ExpoNotificationScheduler";

  private static Handler HANDLER = new Handler(Looper.getMainLooper());

  public NotificationScheduler(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getAllScheduledNotificationsAsync(final Promise promise) {
    ExpoNotificationSchedulerService.enqueueFetchAll(getContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == ExpoNotificationSchedulerService.SUCCESS_CODE) {
          Collection<NotificationRequest> requests = resultData.getParcelableArrayList(ExpoNotificationSchedulerService.NOTIFICATION_REQUESTS_KEY);
          if (requests == null) {
            promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.");
          } else {
            Collection<Bundle> serializedRequests = new ArrayList<>(requests.size());
            for (NotificationRequest request : requests) {
              serializedRequests.add(NotificationSerializer.toBundle(request));
            }
            promise.resolve(serializedRequests);
          }
        } else {
          Exception e = resultData.getParcelable(ExpoNotificationSchedulerService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void scheduleNotificationAsync(final String identifier, Map notificationContentMap, ReadableArguments triggerParams, final Promise promise) {
    try {
      JSONObject payload = new JSONObject(notificationContentMap);
      NotificationContent content = new JSONNotificationContentBuilder().setPayload(payload).build();
      NotificationRequest request = new NotificationRequest(identifier, content, triggerFromParams(triggerParams));
      ExpoNotificationSchedulerService.enqueueSchedule(getContext(), request, new ResultReceiver(HANDLER) {
        @Override
        protected void onReceiveResult(int resultCode, Bundle resultData) {
          super.onReceiveResult(resultCode, resultData);
          if (resultCode == ExpoNotificationSchedulerService.SUCCESS_CODE) {
            promise.resolve(identifier);
          } else {
            Exception e = resultData.getParcelable(ExpoNotificationSchedulerService.EXCEPTION_KEY);
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
    ExpoNotificationSchedulerService.enqueueRemove(getContext(), identifier, new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == ExpoNotificationSchedulerService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(ExpoNotificationSchedulerService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel notification.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void cancelAllScheduledNotificationsAsync(final Promise promise) {
    ExpoNotificationSchedulerService.enqueueRemoveAll(getContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == ExpoNotificationSchedulerService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(ExpoNotificationSchedulerService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel all notifications.", e);
        }
      }
    });
  }

  @Nullable
  protected SchedulableNotificationTrigger triggerFromParams(@Nullable ReadableArguments params) throws InvalidArgumentException {
    if (params == null) {
      return null;
    }

    switch (params.getString("type")) {
      case "interval":
        if (!(params.get("value") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value provided as interval of trigger.");
        }
        return new TimeIntervalTrigger(((Number) params.get("value")).longValue(), params.getBoolean("repeats"));
      case "date":
        if (!(params.get("value") instanceof Number)) {
          throw new InvalidArgumentException("Invalid value provided as date of trigger.");
        }
        return new DateTrigger(((Number) params.get("value")).longValue());
      default:
        throw new InvalidArgumentException("Trigger of type: " + params.getString("type") + " is not supported on Android.");
    }
  }
}
