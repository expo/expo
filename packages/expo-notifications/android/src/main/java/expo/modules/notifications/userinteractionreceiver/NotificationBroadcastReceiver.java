package expo.modules.notifications.userinteractionreceiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

import expo.modules.notifications.configuration.Configuration;

public class NotificationBroadcastReceiver extends BroadcastReceiver {
  private static final String ACTION_RECEIVE_NOTIFICATION = "expo.modules.notifications.ACTION_RECEIVE_NOTIFICATION";

  @Override
  public void onReceive(Context context, Intent intent) {
    showActivity(context, intent);

    UserInteractionReceiver.getInstance().onIntent(intent, context.getApplicationContext());
  }

  private void showActivity(Context context, Intent intent) {
    try {
      sendCustomAction(context);
    } catch (android.content.ActivityNotFoundException e) {
      PackageManager packageManager = context.getPackageManager();
      Intent startActivityIntent = packageManager.getLaunchIntentForPackage(context.getPackageName());
      startActivityIntent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      context.startActivity(startActivityIntent);
    }
  }

  private void sendCustomAction(Context context) {
    Intent customActionIntent = new Intent(ACTION_RECEIVE_NOTIFICATION);
    customActionIntent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
    context.startActivity(customActionIntent);
  }
}
