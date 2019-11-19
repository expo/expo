package expo.modules.notifications.userinteractionreceiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

import expo.modules.notifications.configuration.Configuration;

public class NotificationBroadcastReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    showActivity(context, intent);

    UserInteractionReceiver.getInstance().onIntent(intent, context.getApplicationContext());
  }

  private void showActivity(Context context, Intent intent) {
    String activityName = Configuration.getNotificationActivityName(context);
    Intent startActivityIntent = null;

    if (activityName != null) {
      Class activityClass = null;
      try {
        activityClass = Class.forName(activityName);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      }
      startActivityIntent = new Intent(context, activityClass);
      startActivityIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
    } else {
      PackageManager packageManager = context.getPackageManager();
      startActivityIntent = packageManager.getLaunchIntentForPackage(context.getPackageName());
    }

    context.startActivity(startActivityIntent);
  }
}
