package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.scheduling.NotificationScheduler;
import expo.modules.notifications.notifications.service.ExpoNotificationSchedulerService;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationScheduler extends NotificationScheduler {
  private final ExperienceId mExperienceId;

  public ScopedNotificationScheduler(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  protected NotificationRequest createNotificationRequest(String identifier, NotificationContent content, NotificationTrigger notificationTrigger) {
    return new ScopedNotificationRequest(identifier, content, notificationTrigger, mExperienceId);
  }

  @Override
  protected Collection<Bundle> serializeScheduledNotificationRequests(Collection<NotificationRequest> requests) {
    Collection<Bundle> serializedRequests = new ArrayList<>(requests.size());
    for (NotificationRequest request : requests) {
      if (ScopedNotificationsUtils.shouldHandleNotification(request, mExperienceId)) {
        serializedRequests.add(NotificationSerializer.toBundle(request));
      }
    }
    return serializedRequests;
  }

  @Override
  public void cancelScheduledNotificationAsync(String identifier, final Promise promise) {
    ExpoNotificationSchedulerService.enqueueFetch(getContext(), identifier, new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == ExpoNotificationSchedulerService.SUCCESS_CODE) {
          NotificationRequest request = resultData.getParcelable(ExpoNotificationSchedulerService.NOTIFICATION_REQUESTS_KEY);
          if (request == null || !ScopedNotificationsUtils.shouldHandleNotification(request, mExperienceId)) {
            promise.resolve(null);
          }

          doCancelScheduledNotificationAsync(identifier, promise);
        } else {
          Exception e = resultData.getParcelable(ExpoNotificationSchedulerService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_FETCH", "Failed to fetch scheduled notifications.", e);
        }
      }
    });
  }

  @Override
  public void cancelAllScheduledNotificationsAsync(Promise promise) {
    ExpoNotificationSchedulerService.enqueueFetchAll(getContext(), new ResultReceiver(HANDLER) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == ExpoNotificationSchedulerService.SUCCESS_CODE) {
          Collection<NotificationRequest> requests = resultData.getParcelableArrayList(ExpoNotificationSchedulerService.NOTIFICATION_REQUESTS_KEY);
          if (requests == null) {
            promise.resolve(null);
            return;
          }
          List<String> toRemove = new ArrayList<>();
          for (NotificationRequest request : requests) {
            if (ScopedNotificationsUtils.shouldHandleNotification(request, mExperienceId)) {
              toRemove.add(request.getIdentifier());
            }
          }

          if (toRemove.size() == 0) {
            promise.resolve(null);
            return;
          }

          cancelSelectedNotificationsAsync(toRemove.toArray(new String[0]), promise);
        } else {
          Exception e = resultData.getParcelable(ExpoNotificationSchedulerService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_CANCEL", "Failed to cancel all notifications.", e);
        }
      }
    });
  }

  private void doCancelScheduledNotificationAsync(String identifier, final Promise promise) {
    super.cancelScheduledNotificationAsync(identifier, promise);
  }

  private void cancelSelectedNotificationsAsync(String[] identifiers, final Promise promise) {
    ExpoNotificationSchedulerService.enqueueRemoveSelected(getContext(), identifiers, new ResultReceiver(HANDLER) {
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
}
