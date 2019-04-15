package versioned.host.exp.exponent.modules.api.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import java.util.Calendar;
import java.util.GregorianCalendar;

public class ScheduleTriggerReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    Scheduler.getInstance().scheduleNotifications();
  }

}
