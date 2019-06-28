package expo.modules.battery;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.BatteryManager;

public class BatteryStateReceiver extends BroadcastReceiver {
  public static String INTENT_ACTION = "expo.modules.battery.BatteryStateReceiver";
  public BatteryStateReceiver(){}

  @Override
  public void onReceive(Context context, Intent intent) {
    int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
    BatteryModule.BatteryState bs;
    if (status == BatteryManager.BATTERY_STATUS_CHARGING) {
      bs = (BatteryModule.BatteryState.CHARGING);
    } else if (status == BatteryManager.BATTERY_STATUS_FULL) {
      bs = (BatteryModule.BatteryState.FULL);
    } else if (status == BatteryManager.BATTERY_STATUS_NOT_CHARGING) {
      bs = (BatteryModule.BatteryState.UNPLUGGED);
    }
    else{
      bs = (BatteryModule.BatteryState.UNKNOWN);
    }
    BatteryModule.onBatteryStateChange(bs);
  }
}
