package expo.modules.notifications.notifications.presentation;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;

import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.interfaces.NotificationsScoper;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.service.NotificationsHelper;

public class ExpoNotificationPresentationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationPresenter";

  private final NotificationsHelper mNotificationsHelper;

  public ExpoNotificationPresentationModule(Context context) {
    super(context);
    mNotificationsHelper = new NotificationsHelper(context, NotificationsScoper.create(context).createReconstructor());
  }

  protected NotificationsHelper getNotificationsHelper() {
    return mNotificationsHelper;
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
    mNotificationsHelper.presentNotification(notification, null, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsHelper.SUCCESS_CODE) {
          promise.resolve(identifier);
        } else {
          Exception e = (Exception) resultData.getSerializable(NotificationsHelper.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", "Notification could not be presented.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void getPresentedNotificationsAsync(final Promise promise) {
    mNotificationsHelper.getAllPresented(new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<Notification> notifications = resultData.getParcelableArrayList(NotificationsHelper.NOTIFICATIONS_KEY);
        if (resultCode == NotificationsHelper.SUCCESS_CODE && notifications != null) {
          promise.resolve(serializeNotifications(notifications));
        } else {
          Exception e = resultData.getParcelable(NotificationsHelper.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATIONS_FETCH_FAILED", "A list of displayed notifications could not be fetched.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissNotificationAsync(String identifier, final Promise promise) {
    mNotificationsHelper.dismiss(identifier, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsHelper.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationsHelper.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATION_DISMISSAL_FAILED", "Notification could not be dismissed.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissAllNotificationsAsync(final Promise promise) {
    mNotificationsHelper.dismissAll(new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == NotificationsHelper.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(NotificationsHelper.EXCEPTION_KEY);
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
