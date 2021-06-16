package abi42_0_0.expo.modules.battery;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.PowerManager;

public class BatteryLevelReceiver extends BroadcastReceiver {
  public static String INTENT_ACTION = "expo.modules.battery.BatteryLevelReceiver";

  public BatteryLevelReceiver() {
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    Intent batteryIntent = BatteryModule.mContext.getApplicationContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
    int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
    float batteryLevel = (level != -1 && scale != -1) ? level / (float) scale : -1;
    BatteryModule.onBatteryLevelChange(batteryLevel);
  }
}
