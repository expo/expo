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
 * A snapshot of the device's power, thermal, and battery state.
 *
 * Fields may be `null` when Android does not provide the data,
 * such as on older OS versions or before battery info is available.
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
  val transport: NetworkTransport,
  /**
   * Whether using this network may cost the user money (a metered connection: cellular or a
   * tethered hotspot). Mirrors iOS `NWPath.isExpensive`, so it's the inverse of
   * `NET_CAPABILITY_NOT_METERED`.
   *
   * `null` when there's no usable network to describe. Absence of `NET_CAPABILITY_NOT_METERED` on a
   * capability-poor network is absence of information, not evidence of metering, so this is only
   * populated when the network also reports internet capability.
   */
  val isExpensive: Boolean? = null,
  /**
   * Whether Data Saver is restricting this app's background traffic.
   *
   * Deliberately *not* reported as `isConstrained`: iOS Low Data Mode is a per-path user setting
   * that changes as the user moves between networks, while this is a process-wide Android setting
   * that reads the same on Wi-Fi and cellular. Folding both onto one key would mix two different
   * questions in the same column.
   *
   * `null` when no `ConnectivityManager` is available.
   */
  val dataSaverEnabled: Boolean? = null
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
      ?: return NetworkState(
        connected = false,
        transport = NetworkTransport.NONE,
        isExpensive = null,
        dataSaverEnabled = null
      )

    // Read capabilities once: `cm.activeNetwork` and `getNetworkCapabilities`
    // can drift if the connection changes between calls, and a single read
    // also halves the syscalls.
    val capabilities = cm.activeNetwork?.let { cm.getNetworkCapabilities(it) }
    val connected = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
    return NetworkState(
      connected = connected,
      transport = mapTransport(capabilities),
      // Gated on the same capability `connected` uses, so a network that can't carry traffic reports
      // nothing here instead of asserting it's metered. Inverted: the capability says "not metered",
      // the field says "expensive".
      isExpensive = capabilities
        ?.takeIf { it.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) }
        ?.let { !it.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) },
      // Signals the user's intent to conserve data, not a restriction on the requests this is
      // attached to: Data Saver limits background traffic, and a launch runs in the foreground, so
      // the observed requests proceed at full speed even when this is `true`. `WHITELISTED` reports
      // `false` because the question worth answering is whether Data Saver restricts *this app*,
      // not whether the user switched it on somewhere.
      dataSaverEnabled = cm.restrictBackgroundStatus ==
        ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED
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
