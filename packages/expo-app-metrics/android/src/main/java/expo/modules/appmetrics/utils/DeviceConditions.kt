package expo.modules.appmetrics.utils

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager

enum class ThermalState {
  NOMINAL,
  FAIR,
  SERIOUS,
  CRITICAL,
  UNKNOWN
}

enum class NetworkTransport {
  WIFI,
  CELLULAR,
  ETHERNET,
  OTHER,
  NONE
}

/**
 * A snapshot of the device's power, thermal, and battery state. Fields are
 * nullable so missing OS data (no service, pre-API-29 thermal API, no
 * battery sticky broadcast yet) can be expressed as `null` rather than a
 * sentinel.
 */
data class DeviceState(
  val lowPowerMode: Boolean? = null,
  val thermalState: ThermalState? = null,
  val batteryLevel: Double? = null,
  val batteryCharging: Boolean? = null
)

/**
 * A snapshot of the device's network connectivity. `connected` is `false`
 * and `transport` is `NONE` when no `ConnectivityManager` service is
 * available or the active network has no capabilities.
 */
data class NetworkState(
  val connected: Boolean,
  val transport: NetworkTransport
)

/**
 * Reads the device's environment (power, thermals, battery, connectivity)
 * into typed `DeviceState` / `NetworkState` snapshots. The wire-format
 * conversion to `expo.*` keys lives in `MetricParamsBuilder`.
 */
object DeviceConditions {
  fun deviceState(context: Context): DeviceState {
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
    val lowPowerMode = powerManager?.isPowerSaveMode
    val thermalState = if (powerManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      mapThermalStatus(powerManager.currentThermalStatus)
    } else {
      null
    }

    val batteryStatus = context.registerReceiver(
      null,
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    )
    val batteryLevel = batteryStatus?.let {
      val level = it.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
      val scale = it.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
      if (level >= 0 && scale > 0) {
        level.toDouble() / scale.toDouble()
      } else {
        null
      }
    }
    val batteryCharging = batteryStatus?.let {
      val status = it.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
      if (status == -1) {
        null
      } else {
        status == BatteryManager.BATTERY_STATUS_CHARGING ||
          status == BatteryManager.BATTERY_STATUS_FULL
      }
    }

    return DeviceState(
      lowPowerMode = lowPowerMode,
      thermalState = thermalState,
      batteryLevel = batteryLevel,
      batteryCharging = batteryCharging
    )
  }

  fun networkState(context: Context): NetworkState {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
      ?: return NetworkState(connected = false, transport = NetworkTransport.NONE)

    // Read capabilities once: `cm.activeNetwork` and `getNetworkCapabilities`
    // can drift if the connection changes between calls, and a single read
    // also halves the syscalls.
    val capabilities = cm.activeNetwork?.let { cm.getNetworkCapabilities(it) }
    val connected = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
    return NetworkState(
      connected = connected,
      transport = mapTransport(capabilities)
    )
  }

  private fun mapThermalStatus(status: Int): ThermalState {
    return when (status) {
      PowerManager.THERMAL_STATUS_NONE -> ThermalState.NOMINAL
      PowerManager.THERMAL_STATUS_LIGHT,
      PowerManager.THERMAL_STATUS_MODERATE -> ThermalState.FAIR
      PowerManager.THERMAL_STATUS_SEVERE -> ThermalState.SERIOUS
      PowerManager.THERMAL_STATUS_CRITICAL,
      PowerManager.THERMAL_STATUS_EMERGENCY,
      PowerManager.THERMAL_STATUS_SHUTDOWN -> ThermalState.CRITICAL
      else -> ThermalState.UNKNOWN
    }
  }

  private fun mapTransport(capabilities: NetworkCapabilities?): NetworkTransport {
    if (capabilities == null) {
      return NetworkTransport.NONE
    }
    // VPN tunnels over wifi/cellular, and Bluetooth tethering is rare enough
    // that it's not worth a dedicated bucket — both fold into `OTHER` so the
    // value set matches iOS. If we ever surface VPN explicitly, it should be
    // a separate boolean field rather than a transport value.
    return when {
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetworkTransport.WIFI
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkTransport.CELLULAR
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> NetworkTransport.ETHERNET
      else -> NetworkTransport.OTHER
    }
  }
}
