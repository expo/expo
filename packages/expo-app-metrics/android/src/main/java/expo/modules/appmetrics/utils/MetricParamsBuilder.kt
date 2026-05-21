package expo.modules.appmetrics.utils

import expo.modules.appmetrics.frames.FrameMetricsRecord

/**
 * Single source of truth for the `expo.*` keys we attach to metrics. Takes
 * typed inputs (`DeviceState`, `NetworkState`, `FrameMetricsRecord`) and
 * produces the flat `Map<String, Any>` map the metric envelope expects.
 *
 * Framework-emitted keys override user-supplied keys on collision so the OS
 * readings always win — a user passing `expo.device.lowPowerMode` as a
 * string doesn't get to overwrite the actual OS bool.
 */
object MetricParamsBuilder {
  fun build(
    userParams: Map<String, Any>? = null,
    frameMetrics: FrameMetricsRecord? = null,
    deviceState: DeviceState? = null,
    networkState: NetworkState? = null
  ): Map<String, Any> {
    val params = mutableMapOf<String, Any>()
    userParams?.let { params.putAll(it) }
    if (frameMetrics != null && frameMetrics.expectedFrames > 0) {
      params["expo.frameRate.slowFrames"] = frameMetrics.slowFrames
      params["expo.frameRate.frozenFrames"] = frameMetrics.frozenFrames
      params["expo.frameRate.totalDelay"] = frameMetrics.freezeTimeMs.toDouble() / 1000.0
    }
    if (deviceState != null) {
      deviceState.lowPowerMode?.let { params["expo.device.lowPowerMode"] = it }
      deviceState.thermalState?.let { params["expo.device.thermalState"] = thermalStateString(it) }
      deviceState.batteryLevel?.let { params["expo.device.batteryLevel"] = it }
      deviceState.batteryCharging?.let { params["expo.device.batteryCharging"] = it }
    }
    if (networkState != null) {
      params["expo.network.connected"] = networkState.connected
      params["expo.network.type"] = networkTransportString(networkState.transport)
    }
    return params
  }

  private fun thermalStateString(state: ThermalState): String {
    return when (state) {
      ThermalState.NOMINAL -> "nominal"
      ThermalState.FAIR -> "fair"
      ThermalState.SERIOUS -> "serious"
      ThermalState.CRITICAL -> "critical"
      ThermalState.UNKNOWN -> "unknown"
    }
  }

  private fun networkTransportString(transport: NetworkTransport): String {
    return when (transport) {
      NetworkTransport.WIFI -> "wifi"
      NetworkTransport.CELLULAR -> "cellular"
      NetworkTransport.ETHERNET -> "ethernet"
      NetworkTransport.OTHER -> "other"
      NetworkTransport.NONE -> "none"
    }
  }
}
