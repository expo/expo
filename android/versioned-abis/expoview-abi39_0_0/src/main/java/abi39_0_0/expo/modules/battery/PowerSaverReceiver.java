package abi39_0_0.expo.modules.battery;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

public class PowerSaverReceiver extends BroadcastReceiver {
  public static String INTENT_ACTION = "expo.modules.battery.PowerSaverReceiver";

  public PowerSaverReceiver() {
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    PowerManager powerManager = (PowerManager) BatteryModule.mContext.getApplicationContext().getSystemService(Context.POWER_SERVICE);
    boolean isLowPowerMode = powerManager.isPowerSaveMode();

    BatteryModule.onLowPowerModeChange(isLowPowerMode);
  }
}
