package expo.modules.battery

import android.content.Intent
import android.os.BatteryManager
import io.github.expo.modules.v2.Enumerable

enum class BatteryState(val value: Int) : Enumerable {
  UNKNOWN(0),
  UNPLUGGED(1),
  CHARGING(2),
  FULL(3),
  NOT_CHARGING(4)
}

/**
 * Maps Android [BatteryManager.EXTRA_STATUS] and [BatteryManager.EXTRA_PLUGGED] to JS.
 *
 * [BatteryManager.BATTERY_STATUS_NOT_CHARGING] is reported when the battery is full, when power is
 * connected but charging is paused (e.g. battery protection at 80%), or in other cases.
 * When [plugged] is non-zero, we expose [BatteryState.NOT_CHARGING] so
 * [BatteryManager.BATTERY_STATUS_DISCHARGING] remains the only path to [BatteryState.UNPLUGGED].
 */
fun Intent.toBatteryState(): BatteryState {
  val status = getIntExtra(BatteryManager.EXTRA_STATUS, -1)
  val plugged = getIntExtra(BatteryManager.EXTRA_PLUGGED, 0)

  return when (status) {
    BatteryManager.BATTERY_STATUS_FULL -> BatteryState.FULL
    BatteryManager.BATTERY_STATUS_CHARGING -> BatteryState.CHARGING
    BatteryManager.BATTERY_STATUS_NOT_CHARGING ->
      if (plugged != 0) {
        BatteryState.NOT_CHARGING
      } else {
        BatteryState.UNPLUGGED
      }

    BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryState.UNPLUGGED
    else -> BatteryState.UNKNOWN
  }
}
