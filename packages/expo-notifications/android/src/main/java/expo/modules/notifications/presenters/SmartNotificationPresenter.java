package expo.modules.notifications.presenters;

import android.content.Context;
import android.os.Bundle;

import expo.modules.notifications.postoffice.PostOfficeProxy;

public class SmartNotificationPresenter implements NotificationPresenter {

  private NotificationPresenter mNotificationPresenter = new NotificationPresenterImpl();

  @Override
  public void presentNotification(Context context, String appId, Bundle notification, int notificationId) {
    PostOfficeProxy.getInstance().tryToSendForegroundNotificationToMailbox(appId, notification, (successful) -> {
      if (!successful) {
        mNotificationPresenter.presentNotification(context, appId, notification, notificationId);
      }
      return null;
    });
  }

}
