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
import expo.modules.notifications.service.NotificationsService;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.ScopedNotificationsUtils;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;

public class ScopedExpoNotificationPresentationModule extends ExpoNotificationPresentationModule {
  private final ExperienceKey mExperienceKey;
  private final ScopedNotificationsUtils mScopedNotificationsUtils;

  public ScopedExpoNotificationPresentationModule(Context context, ExperienceKey experienceKey) {
    super(context);
    mExperienceKey = experienceKey;
    mScopedNotificationsUtils = new ScopedNotificationsUtils(context);
  }

  @Override
  protected NotificationRequest createNotificationRequest(String identifier, NotificationContent content, NotificationTrigger trigger) {
    String experienceScopeKey = mExperienceKey == null ? null : mExperienceKey.getScopeKey();
    return new ScopedNotificationRequest(identifier, content, trigger, experienceScopeKey);
  }

  @Override
  protected ArrayList<Bundle> serializeNotifications(Collection<Notification> notifications) {
    ArrayList<Bundle> serializedNotifications = new ArrayList<>();
    for (Notification notification : notifications) {
      if (mScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceKey)) {
        serializedNotifications.add(NotificationSerializer.toBundle(notification));
      }
    }

    return serializedNotifications;
  }

  @Override
  public void dismissNotificationAsync(String identifier, Promise promise) {
    NotificationsService.Companion.getAllPresented(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<Notification> notifications = resultData.getParcelableArrayList(NotificationsService.NOTIFICATIONS_KEY);
        if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
          Notification notification = findNotification(notifications, identifier);
          if (notification == null || !mScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceKey)) {
            promise.resolve(null);
            return;
          }

          doDismissNotificationAsync(identifier, promise);
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e);
        }
      }
    });
  }

  @Override
  public void dismissAllNotificationsAsync(Promise promise) {
    NotificationsService.Companion.getAllPresented(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<Notification> notifications = resultData.getParcelableArrayList(NotificationsService.NOTIFICATIONS_KEY);
        if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
          ArrayList<String> toDismiss = new ArrayList<>();
          for (Notification notification : notifications) {
            if (mScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceKey)) {
              toDismiss.add(notification.getNotificationRequest().getIdentifier());
            }
          }
          dismissSelectedAsync(toDismiss.toArray(new String[0]), promise);
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e);
        }
      }
    });
  }

  private void doDismissNotificationAsync(String identifier, final Promise promise) {
    super.dismissNotificationAsync(identifier, promise);
  }

  private void dismissSelectedAsync(String[] identifiers, final Promise promise) {
    NotificationsService.Companion.dismiss(getContext(), identifiers, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_DISMISSAL_FAILED", "Notifications could not be dismissed.", e);
        }
      }
    });
  }

  private Notification findNotification(Collection<Notification> notifications, String identifier) {
    for (Notification notification : notifications) {
      if (notification.getNotificationRequest().getIdentifier().equals(identifier)) {
        return notification;
      }
    }
    return null;
  }

  @FunctionalInterface
  private interface DismissNotificationFunction {
    void invoke(String identifier, final Promise promise);
  }
}
