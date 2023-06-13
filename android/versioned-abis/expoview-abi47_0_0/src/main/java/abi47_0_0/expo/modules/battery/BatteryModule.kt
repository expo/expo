package abi47_0_0.expo.modules.battery

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod
import abi47_0_0.expo.modules.core.interfaces.RegistryLifecycleListener
import abi47_0_0.expo.modules.core.interfaces.services.EventEmitter
import abi47_0_0.expo.modules.kotlin.types.Enumerable

class BatteryModule(context: Context) : ExportedModule(context), RegistryLifecycleListener {
  private val NAME = "ExpoBattery"

  enum class BatteryState(val value: Int) : Enumerable {
    UNKNOWN(0), UNPLUGGED(1), CHARGING(2), FULL(3);
  }

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): Map<String, Any> {
    return hashMapOf("isSupported" to true)
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    val eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)
    context.registerReceiver(BatteryStateReceiver(eventEmitter), IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    context.registerReceiver(PowerSaverReceiver(eventEmitter), IntentFilter("android.os.action.POWER_SAVE_MODE_CHANGED"))
    val ifilter = IntentFilter().apply {
      addAction(Intent.ACTION_BATTERY_LOW)
      addAction(Intent.ACTION_BATTERY_OKAY)
    }
    context.registerReceiver(BatteryLevelReceiver(eventEmitter), ifilter)
  }

  @ExpoMethod
  fun getBatteryLevelAsync(promise: Promise) {
    val batteryIntent: Intent? = context.applicationContext.registerReceiver(
      null,
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    )
    if (batteryIntent == null) {
      promise.resolve(-1)
      return
    }
    val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
    val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
    val batteryLevel = if (level != -1 && scale != -1) {
      level / scale.toFloat()
    } else {
      -1f
    }
    promise.resolve(batteryLevel)
  }

  @ExpoMethod
  fun getBatteryStateAsync(promise: Promise) {
    val batteryIntent: Intent? = context.applicationContext.registerReceiver(
      null,
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    )
    if (batteryIntent == null) {
      promise.resolve(BatteryState.UNKNOWN.value)
      return
    }
    val status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
    promise.resolve(batteryStatusNativeToJS(status).value)
  }

  @ExpoMethod
  fun isLowPowerModeEnabledAsync(promise: Promise) {
    promise.resolve(isLowPowerModeEnabled)
  }

  @ExpoMethod
  fun isBatteryOptimizationEnabledAsync(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val packageName: String = context.applicationContext.packageName
      val powerManager = context.applicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager?
      if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(packageName)) {
        promise.resolve(true)
        return
      }
    }
    promise.resolve(false)
  }

  // We default to false on web and any future platforms that haven't been
  // implemented yet
  private val isLowPowerModeEnabled: Boolean
    get() {
      val powerManager = context.applicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager // We default to false on web and any future platforms that haven't been
        // implemented yet
        ?: return false
      return powerManager.isPowerSaveMode
    }
}
