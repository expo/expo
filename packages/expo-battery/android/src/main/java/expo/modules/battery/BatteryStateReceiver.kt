package expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Bundle
import org.unimodules.core.interfaces.services.EventEmitter

class BatteryStateReceiver(private val eventEmitter: EventEmitter?) : BroadcastReceiver() {
  private val BATTERY_CHARGED_EVENT_NAME = "Expo.batteryStateDidChange"

  fun batteryStatusNativeToJS(status: Int): BatteryModule.BatteryState {
    return when (status) {
      BatteryManager.BATTERY_STATUS_FULL -> BatteryModule.BatteryState.FULL
      BatteryManager.BATTERY_STATUS_CHARGING -> BatteryModule.BatteryState.CHARGING
      BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryModule.BatteryState.UNPLUGGED
      BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryModule.BatteryState.UNPLUGGED
      else -> BatteryModule.BatteryState.UNKNOWN
    }
  }

  private fun onBatteryStateChange(batteryState: BatteryModule.BatteryState) {
    eventEmitter?.emit(BATTERY_CHARGED_EVENT_NAME, Bundle().apply {
      putInt("batteryState", batteryState.value)
    })
  }

  override fun onReceive(context: Context, intent: Intent) {
    val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
    val bs = batteryStatusNativeToJS(status)
    onBatteryStateChange(bs)
  }
}