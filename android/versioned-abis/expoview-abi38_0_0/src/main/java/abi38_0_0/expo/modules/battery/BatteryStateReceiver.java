package abi38_0_0.expo.modules.battery;

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
    BatteryModule.BatteryState bs = BatteryModule.batteryStatusNativeToJS(status);
    BatteryModule.onBatteryStateChange(bs);
  }
}
