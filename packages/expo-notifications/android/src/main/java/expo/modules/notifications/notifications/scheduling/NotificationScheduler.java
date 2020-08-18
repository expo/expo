package expo.modules.notifications.notifications.scheduling;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ResultReceiver;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.errors.InvalidArgumentException;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.service.NotificationSchedulingHelper;
import expo.modules.notifications.notifications.triggers.ChannelAwareTrigger;
import expo.modules.notifications.notifications.triggers.DailyTrigger;
import expo.modules.notifications.notifications.triggers.DateTrigger;
import expo.modules.notifications.notifications.triggers.TimeIntervalTrigger;

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
    NotificationSchedulingHelper.enqueueFetchAll(getSchedulingContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationSchedulingHelper.SUCCESS_CODE) {
          Collection<NotificationRequest> requests = resultData.getParcelableArrayList(NotificationSchedulingHelper.NOTIFICATION_REQUESTS_KEY);
          if (requests == null) {
            promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.");
          } else {
            promise.resolve(serializeScheduledNotificationRequests(requests));
          }
        } else {
          Exception e = resultData.getParcelable(NotificationSchedulingHelper.EXCEPTION_KEY);
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
      NotificationSchedulingHelper.enqueueSchedule(getSchedulingContext(), request, new ResultReceiver(HANDLER) {
        @Override
        protected void onReceiveResult(int resultCode, Bundle resultData) {
          super.onReceiveResult(resultCode, resultData);
          if (resultCode == NotificationSchedulingHelper.SUCCESS_CODE) {
            promise.resolve(identifier);
          } else {
            Exception e = resultData.getParcelable(NotificationSchedulingHelper.EXCEPTION_KEY);
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
    NotificationSchedulingHelper.enqueueRemove(getSchedulingContext(), identifier, new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationSchedulingHelper.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationSchedulingHelper.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel notification.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void cancelAllScheduledNotificationsAsync(final Promise promise) {
    NotificationSchedulingHelper.enqueueRemoveAll(getSchedulingContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationSchedulingHelper.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationSchedulingHelper.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel all notifications.", e);
        }
      }
    });
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
