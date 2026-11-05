package expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.PowerManager
import android.util.Log
import androidx.core.content.ContextCompat
import expo.modules.core.utilities.ifNull
import io.github.expo.modules.v2.events.Event

internal class EventBroadcastReceiver(
  val event: Event<*>,
  private val receiver: BroadcastReceiver,
  private val filter: IntentFilter
) {
  private var isRegistered = false

  fun register(context: Context) {
    if (isRegistered) {
      return
    }
    ContextCompat.registerReceiver(
      context,
      receiver,
      filter,
      ContextCompat.RECEIVER_NOT_EXPORTED
    )
    isRegistered = true
  }

  fun unregister(context: Context) {
    if (!isRegistered) {
      return
    }
    context.unregisterReceiver(receiver)
    isRegistered = false
  }
}

class BatteryStateReceiver(
  private val onBatteryStateChange: (batteryState: BatteryState) -> Unit
) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    onBatteryStateChange(intent.toBatteryState())
  }
}

class BatteryLevelReceiver(
  private val onBatteryLevelChange: (batteryLevel: Float) -> Unit
) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val batteryIntent = context
      .applicationContext
      .registerReceiver(
        null,
        IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      )
      .ifNull {
        Log.e("Battery", "ACTION_BATTERY_CHANGED unavailable. Events won't be received")
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

class PowerSaverReceiver(
  private val onLowPowerModeChange: (lowPowerMode: Boolean) -> Unit
) : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val powerManager = context
      .applicationContext
      .getSystemService(Context.POWER_SERVICE) as PowerManager

    onLowPowerModeChange(powerManager.isPowerSaveMode)
  }
}
