package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.presentation.ExpoNotificationPresentationModule;
import expo.modules.notifications.notifications.service.BaseNotificationsService;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedExpoNotificationPresentationModule extends ExpoNotificationPresentationModule {
  private final ExperienceId mExperienceId;

  public ScopedExpoNotificationPresentationModule(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  protected NotificationRequest createNotificationRequest(String identifier, NotificationContent content, NotificationTrigger trigger) {
    return new ScopedNotificationRequest(identifier, content, trigger, mExperienceId);
  }

  @Override
  protected ArrayList<Bundle> serializeNotifications(Collection<Notification> notifications) {
    ArrayList<Bundle> serializedNotifications = new ArrayList<>();
    for (Notification notification : notifications) {
      if (ScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceId)) {
        serializedNotifications.add(NotificationSerializer.toBundle(notification));
      }
    }

    return serializedNotifications;
  }

  @Override
  public void dismissNotificationAsync(String identifier, Promise promise) {
    DismissNotificationFunction baseFunction = super::dismissNotificationAsync;
    BaseNotificationsService.enqueueGetAllPresented(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<Notification> notifications = resultData.getParcelableArrayList(BaseNotificationsService.NOTIFICATIONS_KEY);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE && notifications != null) {
          Notification notification = findNotification(notifications, identifier);
          if (notification == null || !ScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceId)) {
            promise.resolve(null);
            return;
          }
          baseFunction.invoke(identifier, promise);
        } else {
          Exception e = resultData.getParcelable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e);
        }
      }
    });
  }

  @Override
  public void dismissAllNotificationsAsync(Promise promise) {
    BaseNotificationsService.enqueueGetAllPresented(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<Notification> notifications = resultData.getParcelableArrayList(BaseNotificationsService.NOTIFICATIONS_KEY);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE && notifications != null) {
          ArrayList<String> toDismiss = new ArrayList<>();
          for (Notification notification : notifications) {
            if (ScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceId)) {
              toDismiss.add(notification.getNotificationRequest().getIdentifier());
            }
          }
          dismissSelectedAsync(toDismiss.toArray(new String[0]), promise);
        } else {
          Exception e = resultData.getParcelable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e);
        }
      }
    });
  }

  private void dismissSelectedAsync(String[] identifiers, final Promise promise) {
    BaseNotificationsService.enqueueDismissSelected(getContext(), identifiers, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_DISMISSAL_FAILED", "Notifications could not be dismissed.", e);
        }
      }
    });
  }

  private Notification findNotification(Collection<Notification> notifications, String identifier) {
    for (Notification notification : notifications) {
      if (notification.getNotificationRequest().getIdentifier().equals(identifier)) {
        return  notification;
      }
    }
    return null;
  }

  @FunctionalInterface
  private interface DismissNotificationFunction {
    void invoke(String identifier, final Promise promise);
  }
}
