package expo.modules.battery

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.PowerManager
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.common.LifecycleState
import io.github.expo.modules.v2.Constant
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

internal const val BATTERY_LEVEL_EVENT_NAME = "Expo.batteryLevelDidChange"
internal const val BATTERY_CHARGED_EVENT_NAME = "Expo.batteryStateDidChange"
internal const val POWER_MODE_EVENT_NAME = "Expo.powerModeDidChange"

@ExpoModule("ExpoBattery")
class BatteryModule : Module() {
  @JS
  @Constant
  val isSupported: Boolean
    get() = true

  @Event(name = BATTERY_LEVEL_EVENT_NAME)
  private val onBatteryLevelChange = event<BatteryLevelEvent>(
    onStartObserving = ::registerBroadcastReceivers,
    onStopObserving = ::unregisterBroadcastReceivers
  )

  @Event(name = BATTERY_CHARGED_EVENT_NAME)
  private val onBatteryStateChange = event<BatteryStateEvent>(
    onStartObserving = ::registerBroadcastReceivers,
    onStopObserving = ::unregisterBroadcastReceivers
  )

  @Event(name = POWER_MODE_EVENT_NAME)
  private val onPowerModeChange = event<PowerModeEvent>(
    onStartObserving = ::registerBroadcastReceivers,
    onStopObserving = ::unregisterBroadcastReceivers
  )

  private val broadcastReceivers = listOf(
    EventBroadcastReceiver(
      onBatteryLevelChange,
      BatteryLevelReceiver { onBatteryLevelChange(BatteryLevelEvent(it)) },
      IntentFilter().apply {
        addAction(Intent.ACTION_BATTERY_LOW)
        addAction(Intent.ACTION_BATTERY_OKAY)
      }
    ),
    EventBroadcastReceiver(
      onBatteryStateChange,
      BatteryStateReceiver { onBatteryStateChange(BatteryStateEvent(it)) },
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    ),
    EventBroadcastReceiver(
      onPowerModeChange,
      PowerSaverReceiver { onPowerModeChange(PowerModeEvent(it)) },
      IntentFilter("android.os.action.POWER_SAVE_MODE_CHANGED")
    )
  )

  private var isLifecycleListenerAdded = false

  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() = registerBroadcastReceivers()

    override fun onHostPause() = unregisterBroadcastReceivers()

    override fun onHostDestroy() = Unit
  }

  override fun onDestroy() {
    val reactContext = reactContextOrNull ?: return
    reactContext.removeLifecycleEventListener(lifecycleListener)
    synchronized(broadcastReceivers) {
      isLifecycleListenerAdded = false
      broadcastReceivers.forEach { it.unregister(reactContext) }
    }
  }

  @JS
  suspend fun getBatteryLevelAsync(): Float = withContext(Dispatchers.IO) {
    val batteryIntent = androidContext.applicationContext.registerReceiver(
      null,
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    ) ?: return@withContext -1f

    val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
    val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)

    if (level != -1 && scale != -1) {
      level / scale.toFloat()
    } else {
      -1f
    }
  }

  @JS
  suspend fun getBatteryStateAsync(): BatteryState = withContext(Dispatchers.IO) {
    val batteryIntent = androidContext
      .applicationContext
      .registerReceiver(
        null,
        IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      ) ?: return@withContext BatteryState.UNKNOWN

    batteryIntent.toBatteryState()
  }

  @JS
  suspend fun isLowPowerModeEnabledAsync(): Boolean = withContext(Dispatchers.IO) {
    val powerManager = androidContext
      .applicationContext
      .getSystemService(Context.POWER_SERVICE) as? PowerManager

    powerManager?.isPowerSaveMode ?: false
  }

  @JS
  suspend fun isBatteryOptimizationEnabledAsync(): Boolean = withContext(Dispatchers.IO) {
    val packageName = androidContext
      .applicationContext
      .packageName

    val powerManager = androidContext
      .applicationContext
      .getSystemService(Context.POWER_SERVICE) as? PowerManager

    powerManager?.isIgnoringBatteryOptimizations(packageName) == false
  }

  private fun registerBroadcastReceivers(): Unit = synchronized(broadcastReceivers) {
    val reactContext = reactContextOrNull ?: return

    if (!isLifecycleListenerAdded) {
      isLifecycleListenerAdded = true
      reactContext.addLifecycleEventListener(lifecycleListener)
    }

    if (reactContext.lifecycleState != LifecycleState.RESUMED) {
      return
    }

    broadcastReceivers
      .filter { it.event.isObserved }
      .forEach { it.register(reactContext) }
  }

  private fun unregisterBroadcastReceivers(): Unit = synchronized(broadcastReceivers) {
    val reactContext = reactContextOrNull ?: return

    val isInForeground = reactContext.lifecycleState == LifecycleState.RESUMED
    broadcastReceivers
      .filter { !isInForeground || !it.event.isObserved }
      .forEach { it.unregister(reactContext) }
  }
}
