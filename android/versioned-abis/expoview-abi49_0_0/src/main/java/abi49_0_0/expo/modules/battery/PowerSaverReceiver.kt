package abi49_0_0.expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PowerManager
import abi49_0_0.expo.modules.core.interfaces.services.EventEmitter

private val POWERMODE_EVENT_NAME = "Expo.powerModeDidChange"

class PowerSaverReceiver(private val eventEmitter: EventEmitter?) : BroadcastReceiver() {
  private fun onLowPowerModeChange(lowPowerMode: Boolean) {
    eventEmitter?.emit(
      POWERMODE_EVENT_NAME,
      Bundle().apply {
        putBoolean("lowPowerMode", lowPowerMode)
      }
    )
  }

  override fun onReceive(context: Context, intent: Intent) {
    val powerManager = context.applicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
    val isLowPowerMode = powerManager.isPowerSaveMode
    onLowPowerModeChange(isLowPowerMode)
  }
}
