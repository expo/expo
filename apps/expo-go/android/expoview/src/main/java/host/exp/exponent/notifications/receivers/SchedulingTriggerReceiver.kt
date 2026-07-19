package host.exp.exponent.notifications.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import host.exp.exponent.notifications.managers.SchedulersManagerProxy

class SchedulingTriggerReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    SchedulersManagerProxy.getInstance(context).triggerAll(intent.action)
  }
}
