package expo.modules.appmetrics.utils

import expo.modules.appmetrics.frames.FrameMetricsRecord
import expo.modules.appmetrics.networkrequests.NetworkRequestSummary

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
    networkState: NetworkState? = null,
    networkRequests: NetworkRequestSummary? = null
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
      networkState.isExpensive?.let { params["expo.network.isExpensive"] = it }
      // Not `expo.network.isConstrained`: that key carries iOS Low Data Mode, which is per-path,
      // while Data Saver is a process-wide setting. See `NetworkState.dataSaverEnabled`.
      networkState.dataSaverEnabled?.let { params["expo.network.dataSaverEnabled"] = it }
    }
    if (networkRequests != null && !networkRequests.isEmpty) {
      params["expo.network.requests.count"] = networkRequests.count
      params["expo.network.requests.failed"] = networkRequests.failed
      // Emitted even at zero, unlike the optional latency fields below: we saw requests and none of
      // them timed out, which is a real measurement rather than a missing one.
      params["expo.network.requests.timedOut"] = networkRequests.timedOut
      params["expo.network.requests.bytesReceived"] = networkRequests.bytesReceived
      params["expo.network.requests.bytesSent"] = networkRequests.bytesSent
      params["expo.network.requests.totalDuration"] = networkRequests.totalDuration
      networkRequests.slowestDuration?.let { params["expo.network.requests.slowestDuration"] = it }
      networkRequests.slowestHost?.let { params["expo.network.requests.slowestHost"] = it }
      // Omitted rather than zeroed when unavailable: a reused connection or a window of cache hits
      // never measured these, and a 0 would read as "instant" on a dashboard.
      networkRequests.slowestTimeToFirstByte?.let {
        params["expo.network.requests.slowestTimeToFirstByte"] = it
      }
      networkRequests.throughputBytesPerSecond?.let {
        params["expo.network.requests.throughputBytesPerSecond"] = it
      }
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
