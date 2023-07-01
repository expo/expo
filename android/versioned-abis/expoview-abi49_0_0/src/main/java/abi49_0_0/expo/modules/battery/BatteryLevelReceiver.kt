package abi49_0_0.expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Bundle
import android.util.Log
import abi49_0_0.expo.modules.core.interfaces.services.EventEmitter

class BatteryLevelReceiver(private val eventEmitter: EventEmitter?) : BroadcastReceiver() {
  private val BATTERY_LEVEL_EVENT_NAME = "Expo.batteryLevelDidChange"

  private fun onBatteryLevelChange(BatteryLevel: Float) {
    eventEmitter?.emit(
      BATTERY_LEVEL_EVENT_NAME,
      Bundle().apply {
        putFloat("batteryLevel", BatteryLevel)
      }
    )
  }

  override fun onReceive(context: Context, intent: Intent) {
    val batteryIntent = context.applicationContext.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    if (batteryIntent == null) {
      Log.e("Battery", "ACTION_BATTERY_CHANGED unavailable. Events wont be received")
      return
    }
    val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
    val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
    val batteryLevel: Float = if (level != -1 && scale != -1) {
      level / scale.toFloat()
    } else {
      -1f
    }
    onBatteryLevelChange(batteryLevel)
  }
}
