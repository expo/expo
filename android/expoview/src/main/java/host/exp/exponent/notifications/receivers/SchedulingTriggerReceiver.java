package host.exp.exponent.notifications.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import host.exp.exponent.notifications.managers.SchedulersManagerProxy;

public class SchedulingTriggerReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    SchedulersManagerProxy.getInstance(context).triggerAll(intent.getAction());
  }

}
