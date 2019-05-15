package versioned.host.exp.exponent.modules.api.notifications.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import versioned.host.exp.exponent.modules.api.notifications.managers.SchedulersManagerProxy;

public class SchedulingTriggerReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    SchedulersManagerProxy.getInstance(context).scheduleAll(intent.getAction());
  }

}
