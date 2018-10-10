package expo.modules.firebase.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.HeadlessJsTaskService;

import expo.modules.firebase.app.Utils;


public class FirebaseBackgroundNotificationActionReceiver extends BroadcastReceiver {
  static boolean isBackgroundNotficationIntent(Intent intent) {
    return intent.getExtras() != null && intent.hasExtra("action") && intent.hasExtra("notification");
  }

  static Bundle toNotificationOpenMap(Intent intent) {
    Bundle extras = intent.getExtras();
    Bundle notificationMap = extras.getBundle("notification");
    Bundle notificationOpenMap = new Bundle();
    notificationOpenMap.putString("action", extras.getString("action"));
    notificationOpenMap.putBundle("notification", notificationMap);
    return notificationOpenMap;
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    if (!isBackgroundNotficationIntent(intent)) {
      return;
    }

    if (Utils.isAppInForeground(context)) {
      Bundle notificationOpenMap = toNotificationOpenMap(intent);
      Utils.sendEvent(FirebaseNotificationsModule.moduleRegistry, "notifications_notification_opened", notificationOpenMap);
    } else {
      Intent serviceIntent = new Intent(
        context,
        FirebaseBackgroundNotificationActionsService.class
      );
      serviceIntent.putExtras(intent.getExtras());
      context.startService(serviceIntent);
      HeadlessJsTaskService.acquireWakeLockNow(context);
    }
  }
}
