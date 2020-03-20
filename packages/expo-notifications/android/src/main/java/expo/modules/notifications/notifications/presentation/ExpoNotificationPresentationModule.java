package expo.modules.notifications.notifications.presentation;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.json.JSONObject;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.Map;

import expo.modules.notifications.notifications.JSONNotificationContentBuilder;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.service.BaseNotificationsService;

public class ExpoNotificationPresentationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationPresenter";

  public ExpoNotificationPresentationModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void presentNotificationAsync(String identifier, Map notificationContentMap, final Promise promise) {
    JSONObject payload = new JSONObject(notificationContentMap);
    NotificationContent content = new JSONNotificationContentBuilder().setPayload(payload).build();
    NotificationRequest request = new NotificationRequest(identifier, content, null);
    Notification notification = new Notification(request);
    BaseNotificationsService.enqueuePresent(getContext(), notification, null, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = (Exception) resultData.getSerializable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", "Notification could not be presented.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissNotificationAsync(String identifier, final Promise promise) {
    BaseNotificationsService.enqueueDismiss(getContext(), identifier, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE) {
          promise.resolve(null);
        } else {
          Exception e = resultData.getParcelable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_NOTIFICATION_DISMISSAL_FAILED", "Notification could not be dismissed.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void dismissAllNotificationsAsync(final Promise promise) {
    BaseNotificationsService.enqueueDismissAll(getContext(), new ResultReceiver(null) {
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
}
