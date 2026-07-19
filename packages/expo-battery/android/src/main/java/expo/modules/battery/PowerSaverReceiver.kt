package expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PowerManager

class PowerSaverReceiver(private val sendEvent: (name: String, body: Bundle) -> Unit) : BroadcastReceiver() {
  private fun onLowPowerModeChange(lowPowerMode: Boolean) {
    sendEvent(
      POWER_MODE_EVENT_NAME,
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
