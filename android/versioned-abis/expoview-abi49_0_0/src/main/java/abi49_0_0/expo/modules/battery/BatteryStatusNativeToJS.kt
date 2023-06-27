package abi49_0_0.expo.modules.battery

import android.os.BatteryManager

fun batteryStatusNativeToJS(status: Int): BatteryModule.BatteryState {
  return when (status) {
    BatteryManager.BATTERY_STATUS_FULL -> BatteryModule.BatteryState.FULL
    BatteryManager.BATTERY_STATUS_CHARGING -> BatteryModule.BatteryState.CHARGING
    BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryModule.BatteryState.UNPLUGGED
    BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryModule.BatteryState.UNPLUGGED
    else -> BatteryModule.BatteryState.UNKNOWN
  }
}
