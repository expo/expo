package expo.modules.notifications.presenters;

import android.content.Context;
import android.os.Bundle;

import java.util.Random;

public interface NotificationPresenter {

  default void presentNotification(Context context, String appId, Bundle notification) {
    Integer id = Math.abs(new Random().nextInt(Integer.MAX_VALUE));
    presentNotification(context, appId, notification, id);
  }

  void presentNotification(Context context, String appId, Bundle notification, int notificationId);

}
