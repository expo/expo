package versioned.host.exp.exponent.modules.api.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class SchedulingTriggerReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(Context context, Intent intent) {
    SchedulersManagerProxy.getInstance(context).scheduleAll(intent.getAction());
  }

}
