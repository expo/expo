package expo.modules.appmetrics.utils

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager

/**
 * Snapshots of the device's environment (power, thermals, connectivity)
 * attached to metrics like `timeToInteractive` so regressions can be
 * correlated with conditions outside the app's control.
 */
object DeviceConditions {
  fun deviceParams(context: Context): Map<String, Any> {
    val params = mutableMapOf<String, Any>()

    val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
    if (powerManager != null) {
      params["expo.device.lowPowerMode"] = powerManager.isPowerSaveMode
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        params["expo.device.thermalState"] = thermalStatusString(powerManager.currentThermalStatus)
      }
    }

    val batteryStatus = context.registerReceiver(
      null,
      IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    )
    if (batteryStatus != null) {
      val level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
      val scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
      if (level >= 0 && scale > 0) {
        params["expo.device.batteryLevel"] = level.toDouble() / scale.toDouble()
      }
      val status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
      if (status != -1) {
        params["expo.device.batteryCharging"] =
          status == BatteryManager.BATTERY_STATUS_CHARGING ||
          status == BatteryManager.BATTERY_STATUS_FULL
      }
    }

    return params
  }

  fun networkParams(context: Context): Map<String, Any> {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
      ?: return mapOf(
        "expo.network.connected" to false,
        "expo.network.type" to "unknown"
      )

    // Read capabilities once: `cm.activeNetwork` and `getNetworkCapabilities`
    // can drift if the connection changes between calls, and a single read
    // also halves the syscalls.
    val capabilities = cm.activeNetwork?.let { cm.getNetworkCapabilities(it) }
    val connected = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true

    return mapOf(
      "expo.network.connected" to connected,
      "expo.network.type" to networkTypeString(capabilities)
    )
  }

  private fun thermalStatusString(status: Int): String {
    return when (status) {
      PowerManager.THERMAL_STATUS_NONE -> "nominal"
      PowerManager.THERMAL_STATUS_LIGHT,
      PowerManager.THERMAL_STATUS_MODERATE -> "fair"
      PowerManager.THERMAL_STATUS_SEVERE -> "serious"
      PowerManager.THERMAL_STATUS_CRITICAL,
      PowerManager.THERMAL_STATUS_EMERGENCY,
      PowerManager.THERMAL_STATUS_SHUTDOWN -> "critical"
      else -> "unknown"
    }
  }

  private fun networkTypeString(capabilities: NetworkCapabilities?): String {
    if (capabilities == null) {
      return "none"
    }
    // VPN tunnels over wifi/cellular, and Bluetooth tethering is rare enough
    // that it's not worth a dedicated bucket — both fold into `other` so the
    // value set matches iOS. If we ever surface VPN explicitly, it should be
    // a separate boolean param rather than a transport value.
    return when {
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
      else -> "other"
    }
  }
}
