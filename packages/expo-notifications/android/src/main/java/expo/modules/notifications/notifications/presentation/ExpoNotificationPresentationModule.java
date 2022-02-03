package expo.modules.notifications.notifications.presentation;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import expo.modules.core.ExportedModule;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;

import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.service.NotificationsService;

public class ExpoNotificationPresentationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationPresenter";

  public ExpoNotificationPresentationModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  // Remove once presentNotificationAsync is removed
  @ExpoMethod
  public void presentNotificationAsync(final String identifier, ReadableArguments payload, final Promise promise) {
    NotificationContent content = new ArgumentsNotificationContentBuilder(getContext()).setPayload(payload).build();
    NotificationRequest request = createNotificationRequest(identifier, content, null);
    Notification notification = new Notification(request);
    NotificationsService.Companion.present(getContext(), notification, null, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(identifier);
        } else {
          Exception e = (Exception) resultData.getSerializable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", "Notification could not be presented.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void getPresentedNotificationsAsync(final Promise promise) {
    NotificationsService.Companion.getAllPresented(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<Notification> notifications = resultData.getParcelableArrayList(NotificationsService.NOTIFICATIONS_KEY);
        if (resultCode == NotificationsService.SUCCESS_CODE && notifications != null) {
          promise.resolve(serializeNotifications(notifications));
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissNotificationAsync(String identifier, final Promise promise) {
    NotificationsService.Companion.dismiss(getContext(), new String[]{identifier}, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATION_DISMISSAL_FAILED", "Notification could not be dismissed.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissAllNotificationsAsync(final Promise promise) {
    NotificationsService.Companion.dismissAll(getContext(), new ResultReceiver(null) {
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

  protected NotificationRequest createNotificationRequest(String identifier, NotificationContent content, NotificationTrigger trigger) {
    return new NotificationRequest(identifier, content, null);
  }

  protected ArrayList<Bundle> serializeNotifications(Collection<Notification> notifications) {
    ArrayList<Bundle> serializedNotifications = new ArrayList<>();
    for (Notification notification : notifications) {
      serializedNotifications.add(NotificationSerializer.toBundle(notification));
    }

    return serializedNotifications;
  }
}
