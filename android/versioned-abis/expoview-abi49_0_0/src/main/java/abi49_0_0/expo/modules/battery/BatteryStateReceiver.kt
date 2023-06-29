package abi49_0_0.expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Bundle
import abi49_0_0.expo.modules.core.interfaces.services.EventEmitter

private val BATTERY_CHARGED_EVENT_NAME = "Expo.batteryStateDidChange"

class BatteryStateReceiver(private val eventEmitter: EventEmitter?) : BroadcastReceiver() {
  private fun onBatteryStateChange(batteryState: BatteryModule.BatteryState) {
    eventEmitter?.emit(
      BATTERY_CHARGED_EVENT_NAME,
      Bundle().apply {
        putInt("batteryState", batteryState.value)
      }
    )
  }

  override fun onReceive(context: Context, intent: Intent) {
    val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
    val bs = batteryStatusNativeToJS(status)
    onBatteryStateChange(bs)
  }
}
