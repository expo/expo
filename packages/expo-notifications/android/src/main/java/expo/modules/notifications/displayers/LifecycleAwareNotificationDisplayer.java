package expo.modules.notifications.displayers;

import android.content.Context;
import android.os.Bundle;

import expo.modules.notifications.postoffice.PostOfficeProxy;

public class LifecycleAwareNotificationDisplayer implements NotificationDisplayer {

  private NotificationDisplayer mNotificationDisplayer;

  LifecycleAwareNotificationDisplayer(NotificationDisplayer notificationDisplayer) {
    mNotificationDisplayer = notificationDisplayer;
  }

  @Override
  public void displayNotification(Context context, String appId, Bundle notification, int notificationId) {
    PostOfficeProxy.getInstance().tryToSendForegroundNotificationToMailbox(appId, notification, (successful) -> {
      if (!successful) {
        mNotificationDisplayer.displayNotification(context, appId, notification, notificationId);
      }
      return null;
    });
  }

}
