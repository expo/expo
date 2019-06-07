package expo.modules.notifications.userinteractionreceiver;

import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.NotificationManagerCompat;

import expo.modules.notifications.action.NotificationActionCenter;
import expo.modules.notifications.NotificationConstants;
import expo.modules.notifications.postoffice.PostOfficeProxy;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_ACTION_TYPE_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_OBJECT_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_STICKY;

public class UserInteractionReceiver {

  private static volatile UserInteractionReceiver mInstance = null;

  private UserInteractionReceiver() { }

  public synchronized static UserInteractionReceiver getInstance() {
    if (mInstance == null) {
      mInstance = new UserInteractionReceiver();
    }
    return mInstance;
  }

  public boolean onIntent(Intent intent, Context context) {
    Bundle bundle = intent.getExtras();

    if (bundle == null) {
      return false;
    }

    Bundle notification = bundle.getBundle(NOTIFICATION_OBJECT_KEY);

    if (notification == null) {
      return false;
    }

    String appId = notification.getString(NOTIFICATION_APP_ID_KEY);
    Integer notificationIntId = notification.getInt("notificationIntId");

    if (!notification.getBoolean(NOTIFICATION_STICKY)) {
      NotificationManagerCompat.from(context).cancel(appId, notificationIntId);
    }

    // Add action type
    if (bundle.containsKey(NOTIFICATION_ACTION_TYPE_KEY)) {
      notification.putString(
          NotificationConstants.NOTIFICATION_ACTION_TYPE,
          bundle.getString(NOTIFICATION_ACTION_TYPE_KEY)
      );
    }
    // Add remote input
    Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
    if (remoteInput != null) {
      notification.putString(
          NotificationConstants.NOTIFICATION_INPUT_TEXT,
          remoteInput.getString(NotificationActionCenter.KEY_TEXT_REPLY)
      );
    }

    PostOfficeProxy.getInstance().notifyAboutUserInteraction(
        appId,
        notification
    );

    return true;
  }

}
