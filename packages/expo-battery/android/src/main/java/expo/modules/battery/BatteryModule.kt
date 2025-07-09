package expo.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Bundle
import android.os.PowerManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable
import java.lang.ref.WeakReference

internal const val BATTERY_LEVEL_EVENT_NAME = "Expo.batteryLevelDidChange"
internal const val BATTERY_CHARGED_EVENT_NAME = "Expo.batteryStateDidChange"
internal const val POWER_MODE_EVENT_NAME = "Expo.powerModeDidChange"

class BatteryModule : Module() {
  enum class BatteryState(val value: Int) : Enumerable {
    UNKNOWN(0),
    UNPLUGGED(1),
    CHARGING(2),
    FULL(3)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBattery")

    Constants("isSupported" to true)

    Events(
      BATTERY_LEVEL_EVENT_NAME,
      BATTERY_CHARGED_EVENT_NAME,
      POWER_MODE_EVENT_NAME
    )

    OnCreate {
      registerBroadcastReceivers(context)
    }

    OnDestroy {
      unregisterBroadcastReceivers(context)
    }

    OnActivityEntersForeground {
      registerBroadcastReceivers(context)
    }

    OnActivityEntersBackground {
      unregisterBroadcastReceivers(context)
    }

    AsyncFunction<Float>("getBatteryLevelAsync") {
      val batteryIntent = context.applicationContext.registerReceiver(
        null,
        IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      ) ?: return@AsyncFunction -1f

      val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
      val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
      val batteryLevel = if (level != -1 && scale != -1) {
        level / scale.toFloat()
      } else {
        -1f
      }

      return@AsyncFunction batteryLevel
    }

    AsyncFunction<Int>("getBatteryStateAsync") {
      val batteryIntent = context.applicationContext.registerReceiver(
        null,
        IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      ) ?: return@AsyncFunction BatteryState.UNKNOWN.value

      val status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
      return@AsyncFunction batteryStatusNativeToJS(status).value
    }

    AsyncFunction<Boolean>("isLowPowerModeEnabledAsync") {
      isLowPowerModeEnabled
    }

    AsyncFunction<Boolean>("isBatteryOptimizationEnabledAsync") {
      val packageName = context.applicationContext.packageName
      val powerManager = context.applicationContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
      return@AsyncFunction powerManager?.isIgnoringBatteryOptimizations(packageName) == false
    }
  }

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val broadcastReceivers = mutableListOf<BroadcastReceiver>()

  private inline fun accessBroadcastReceivers(block: MutableList<BroadcastReceiver>.() -> Unit) {
    synchronized(broadcastReceivers) {
      block.invoke(broadcastReceivers)
    }
  }

  private fun unregisterBroadcastReceivers(context: Context) {
    accessBroadcastReceivers {
      forEach {
        context.unregisterReceiver(it)
      }
      clear()
    }
  }

  private fun registerBroadcastReceivers(context: Context) {
    accessBroadcastReceivers {
      if (isNotEmpty()) {
        return
      }
    }

    val weakModule = WeakReference(this@BatteryModule)
    val emitEvent = { name: String, body: Bundle ->
      try {
        // It may thrown, because RN event emitter may not be available
        // we can just ignore those cases
        weakModule.get()?.sendEvent(name, body)
      } catch (_: Throwable) {
      }
      Unit
    }
    val batteryStateReceiver = BatteryStateReceiver(emitEvent)
    val powerSaverReceiver = PowerSaverReceiver(emitEvent)
    val batteryLevelReceiver = BatteryLevelReceiver(emitEvent)

    context.registerReceiver(batteryStateReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    context.registerReceiver(powerSaverReceiver, IntentFilter("android.os.action.POWER_SAVE_MODE_CHANGED"))
    context.registerReceiver(
      batteryLevelReceiver,
      IntentFilter().apply {
        addAction(Intent.ACTION_BATTERY_LOW)
        addAction(Intent.ACTION_BATTERY_OKAY)
      }
    )

    accessBroadcastReceivers {
      add(batteryStateReceiver)
      add(batteryLevelReceiver)
      add(powerSaverReceiver)
    }
  }

  // We default to false on web and any future platforms that haven't been implemented yet
  private val isLowPowerModeEnabled: Boolean
    get() {
      val powerManager = context.applicationContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
        ?: return false
      return powerManager.isPowerSaveMode
    }
}
