package expo.modules.battery

import android.os.BatteryManager

/**
 * Maps Android [BatteryManager.EXTRA_STATUS] and [BatteryManager.EXTRA_PLUGGED] to JS.
 *
 * [BatteryManager.BATTERY_STATUS_NOT_CHARGING] is reported when the battery is full, when power is
 * connected but charging is paused (e.g. battery protection at 80%), or in other cases.
 * When [plugged] is non-zero, we expose [BatteryModule.BatteryState.NOT_CHARGING] so
 * [BatteryManager.BATTERY_STATUS_DISCHARGING] remains the only path to [BatteryModule.BatteryState.UNPLUGGED].
 */
fun batteryStatusNativeToJS(status: Int, plugged: Int): BatteryModule.BatteryState {
  return when (status) {
    BatteryManager.BATTERY_STATUS_FULL -> BatteryModule.BatteryState.FULL
    BatteryManager.BATTERY_STATUS_CHARGING -> BatteryModule.BatteryState.CHARGING
    BatteryManager.BATTERY_STATUS_NOT_CHARGING ->
      if (plugged != 0) {
        BatteryModule.BatteryState.NOT_CHARGING
      } else {
        BatteryModule.BatteryState.UNPLUGGED
      }
    BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryModule.BatteryState.UNPLUGGED
    else -> BatteryModule.BatteryState.UNKNOWN
  }
}
