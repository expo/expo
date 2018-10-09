package expo.modules.firebase.notifications;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/*
 * This is invoked by the Alarm Manager when it is time to display a scheduled notification.
 */
public class FirebaseNotificationReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    new FirebaseNotificationManager(context, FirebaseNotificationsModule.moduleRegistry).displayScheduledNotification(intent.getExtras());
  }
}
