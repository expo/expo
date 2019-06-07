package expo.modules.notifications.userinteractionreceiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import expo.modules.notifications.configuration.Configuration;

public class NotificationBroadcastReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    showActivity(context, intent);

    UserInteractionReceiver.getInstance().onIntent(intent, context.getApplicationContext());
  }

  private void showActivity(Context context, Intent intent) {
    String activityName = Configuration.getValueFor(Configuration.NOTIFICATION_ACTIVITY_NAME_KEY, context);
    Class activityClass = null;
    try {
      activityClass = Class.forName(activityName);
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
    }

    Intent startActivityIntent = new Intent(context, activityClass);
    startActivityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(startActivityIntent);
  }
}
