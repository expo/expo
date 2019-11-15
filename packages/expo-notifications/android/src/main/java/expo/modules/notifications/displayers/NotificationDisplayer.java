package expo.modules.notifications.displayers;

import android.content.Context;
import android.os.Bundle;

import java.util.Random;

public interface NotificationDisplayer {

  default void displayNotification(Context context, String appId, Bundle notification) {
    Integer id = Math.abs(new Random().nextInt(Integer.MAX_VALUE));
    displayNotification(context, appId, notification, id);
  }

  void displayNotification(Context context, String appId, Bundle notification, int notificationId);

}
