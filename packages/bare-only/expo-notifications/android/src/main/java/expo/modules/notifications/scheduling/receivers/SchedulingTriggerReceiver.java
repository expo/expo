package expo.modules.notifications.scheduling.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import expo.modules.notifications.scheduling.managers.SchedulersManagerProxy;

public class SchedulingTriggerReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    SchedulersManagerProxy.getInstance(context).triggerAll(intent.getAction());
  }

}
