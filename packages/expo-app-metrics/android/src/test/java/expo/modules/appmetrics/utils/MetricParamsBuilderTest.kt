package expo.modules.appmetrics.utils

import expo.modules.appmetrics.frames.FrameMetricsRecord
import expo.modules.appmetrics.networkrequests.NetworkRequestSummary
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MetricParamsBuilderTest {
  @Test
  fun `emits empty map with no inputs`() {
    val params = MetricParamsBuilder.build()
    assertEquals(emptyMap<String, Any>(), params)
  }

  @Test
  fun `passes user params through unchanged`() {
    val params = MetricParamsBuilder.build(
      userParams = mapOf("tenant" to "acme", "cohort" to 3)
    )
    assertEquals("acme", params["tenant"])
    assertEquals(3, params["cohort"])
  }

  @Test
  fun `maps connected wifi NetworkState to wifi keys`() {
    val params = MetricParamsBuilder.build(
      networkState = NetworkState(connected = true, transport = NetworkTransport.WIFI)
    )
    assertEquals(true, params["expo.network.connected"])
    assertEquals("wifi", params["expo.network.type"])
  }

  @Test
  fun `maps disconnected NetworkState to none keys`() {
    val params = MetricParamsBuilder.build(
      networkState = NetworkState(connected = false, transport = NetworkTransport.NONE)
    )
    assertEquals(false, params["expo.network.connected"])
    assertEquals("none", params["expo.network.type"])
  }

  @Test
  fun `omits frame keys when expectedFrames is zero`() {
    val params = MetricParamsBuilder.build(frameMetrics = FrameMetricsRecord())
    assertNull(params["expo.frameRate.slowFrames"])
    assertNull(params["expo.frameRate.frozenFrames"])
    assertNull(params["expo.frameRate.totalDelay"])
  }

  @Test
  fun `emits frame keys when expectedFrames is positive`() {
    val params = MetricParamsBuilder.build(
      frameMetrics = FrameMetricsRecord(
        expectedFrames = 12,
        slowFrames = 3,
        frozenFrames = 1,
        freezeTimeMs = 400
      )
    )
    assertEquals(3L, params["expo.frameRate.slowFrames"])
    assertEquals(1L, params["expo.frameRate.frozenFrames"])
    assertEquals(0.4, params["expo.frameRate.totalDelay"])
  }

  @Test
  fun `emits all device keys when DeviceState fields are populated`() {
    val params = MetricParamsBuilder.build(
      deviceState = DeviceState(
        lowPowerMode = true,
        thermalState = ThermalState.SERIOUS,
        batteryLevel = 0.42,
        batteryCharging = false
      )
    )
    assertEquals(true, params["expo.device.lowPowerMode"])
    assertEquals("serious", params["expo.device.thermalState"])
    assertEquals(0.42, params["expo.device.batteryLevel"])
    assertEquals(false, params["expo.device.batteryCharging"])
  }

  @Test
  fun `omits device keys when DeviceState fields are null`() {
    val params = MetricParamsBuilder.build(deviceState = DeviceState())
    assertNull(params["expo.device.lowPowerMode"])
    assertNull(params["expo.device.thermalState"])
    assertNull(params["expo.device.batteryLevel"])
    assertNull(params["expo.device.batteryCharging"])
  }

  @Test
  fun `framework-emitted keys override user-supplied keys on collision`() {
    val params = MetricParamsBuilder.build(
      userParams = mapOf("expo.device.lowPowerMode" to "user-supplied"),
      deviceState = DeviceState(lowPowerMode = true)
    )
    assertEquals(true, params["expo.device.lowPowerMode"])
  }

  @Test
  fun `maps every thermal state to its expo string`() {
    fun stateFor(thermal: ThermalState) = MetricParamsBuilder.build(
      deviceState = DeviceState(thermalState = thermal)
    )["expo.device.thermalState"]
    assertEquals("nominal", stateFor(ThermalState.NOMINAL))
    assertEquals("fair", stateFor(ThermalState.FAIR))
    assertEquals("serious", stateFor(ThermalState.SERIOUS))
    assertEquals("critical", stateFor(ThermalState.CRITICAL))
    assertEquals("unknown", stateFor(ThermalState.UNKNOWN))
  }

  @Test
  fun `maps every transport to its expo string`() {
    fun typeFor(transport: NetworkTransport) = MetricParamsBuilder.build(
      networkState = NetworkState(connected = true, transport = transport)
    )["expo.network.type"]
    assertEquals("wifi", typeFor(NetworkTransport.WIFI))
    assertEquals("cellular", typeFor(NetworkTransport.CELLULAR))
    assertEquals("ethernet", typeFor(NetworkTransport.ETHERNET))
    assertEquals("other", typeFor(NetworkTransport.OTHER))
    assertEquals("none", typeFor(NetworkTransport.NONE))
  }

  @Test
  fun `omits network-requests keys when the summary is empty`() {
    val params = MetricParamsBuilder.build(networkRequests = NetworkRequestSummary.empty)
    assertNull(params["expo.network.requests.count"])
    assertNull(params["expo.network.requests.failed"])
    assertNull(params["expo.network.requests.bytesSent"])
    assertNull(params["expo.network.requests.bytesReceived"])
    assertNull(params["expo.network.requests.totalDuration"])
    assertNull(params["expo.network.requests.slowest.duration"])
    assertNull(params["expo.network.requests.slowest.host"])
  }

  @Test
  fun `emits the seven network-requests keys when the summary has work`() {
    val summary = NetworkRequestSummary(
      count = 5,
      failed = 1,
      bytesReceived = 1234,
      bytesSent = 567,
      totalDuration = 1.5,
      slowest = NetworkRequestSummary.SlowestRequest(
        host = "expo.dev",
        duration = 0.7,
        statusCode = 200,
        timeToFirstByte = null,
        bytesReceived = null
      )
    )
    val params = MetricParamsBuilder.build(networkRequests = summary)
    assertEquals(5, params["expo.network.requests.count"])
    assertEquals(1, params["expo.network.requests.failed"])
    assertEquals(1234L, params["expo.network.requests.bytesReceived"])
    assertEquals(567L, params["expo.network.requests.bytesSent"])
    assertEquals(1.5, params["expo.network.requests.totalDuration"])
    assertEquals(0.7, params["expo.network.requests.slowest.duration"])
    assertEquals("expo.dev", params["expo.network.requests.slowest.host"])
  }

  @Test
  fun `emits path cost flags alongside the connection type`() {
    val params = MetricParamsBuilder.build(
      networkState = NetworkState(
        connected = true,
        transport = NetworkTransport.CELLULAR,
        isExpensive = true,
        dataSaverEnabled = true
      )
    )
    assertEquals(true, params["expo.network.isExpensive"])
    assertEquals(true, params["expo.network.dataSaverEnabled"])
  }

  @Test
  fun `does not report Data Saver under the iOS isConstrained key`() {
    // Low Data Mode is per-path; Data Saver is process-wide. Same column would mix two questions.
    val params = MetricParamsBuilder.build(
      networkState = NetworkState(
        connected = true,
        transport = NetworkTransport.CELLULAR,
        dataSaverEnabled = true
      )
    )
    assertNull(params["expo.network.isConstrained"])
  }

  @Test
  fun `omits path cost flags when the OS did not report them`() {
    val params = MetricParamsBuilder.build(
      networkState = NetworkState(connected = true, transport = NetworkTransport.WIFI)
    )
    assertEquals(true, params["expo.network.connected"])
    assertNull(params["expo.network.isExpensive"])
    assertNull(params["expo.network.dataSaverEnabled"])
  }

  @Test
  fun `emits the timeout count alongside the failure count`() {
    val summary = NetworkRequestSummary(
      count = 3,
      failed = 2,
      timedOut = 1,
      bytesReceived = 0,
      bytesSent = 0,
      totalDuration = 30.2,
      slowest = NetworkRequestSummary.SlowestRequest(
        host = "slow.expo.dev",
        duration = 30.0,
        statusCode = 200,
        timeToFirstByte = null,
        bytesReceived = null
      )
    )
    val params = MetricParamsBuilder.build(networkRequests = summary)
    assertEquals(2, params["expo.network.requests.failed"])
    assertEquals(1, params["expo.network.requests.timedOut"])
  }

  @Test
  fun `emits a zero timeout count so its absence is not ambiguous`() {
    // Unlike the optional latency fields, a count of zero is a real measurement: we saw requests
    // and none of them timed out. Omitting it would make "no timeouts" and "not measured" look
    // the same.
    val summary = NetworkRequestSummary(
      count = 1,
      failed = 0,
      timedOut = 0,
      bytesReceived = 10,
      bytesSent = 10,
      totalDuration = 0.1,
      slowest = NetworkRequestSummary.SlowestRequest(
        host = "expo.dev",
        duration = 0.1,
        statusCode = 200,
        timeToFirstByte = null,
        bytesReceived = null
      )
    )
    val params = MetricParamsBuilder.build(networkRequests = summary)
    assertEquals(0, params["expo.network.requests.timedOut"])
  }

  @Test
  fun `emits the derived latency and throughput keys when the summary has them`() {
    val summary = NetworkRequestSummary(
      count = 4,
      failed = 1,
      bytesReceived = 12000,
      bytesSent = 800,
      totalDuration = 1.4,
      slowest = NetworkRequestSummary.SlowestRequest(
        host = "api.expo.dev",
        duration = 0.6,
        statusCode = 200,
        timeToFirstByte = 0.35,
        bytesReceived = 9000
      ),
      throughputBytesPerSecond = 8571.4
    )
    val params = MetricParamsBuilder.build(networkRequests = summary)
    assertEquals(0.6, params["expo.network.requests.slowest.duration"])
    assertEquals("api.expo.dev", params["expo.network.requests.slowest.host"])
    assertEquals(200, params["expo.network.requests.slowest.statusCode"])
    assertEquals(0.35, params["expo.network.requests.slowest.timeToFirstByte"])
    assertEquals(9000L, params["expo.network.requests.slowest.bytesReceived"])
    assertEquals(8571.4, params["expo.network.requests.throughputBytesPerSecond"])
  }

  @Test
  fun `omits the derived keys rather than emitting zero when they are unavailable`() {
    // Every connection reused and nothing received: emitting 0 would read as "instant, no data"
    // instead of "not measured" on a dashboard.
    val summary = NetworkRequestSummary(
      count = 2,
      failed = 0,
      bytesReceived = 0,
      bytesSent = 40,
      totalDuration = 0.2,
      slowest = NetworkRequestSummary.SlowestRequest(
        host = "api.expo.dev",
        duration = 0.1,
        statusCode = 200,
        timeToFirstByte = null,
        bytesReceived = null
      )
    )
    val params = MetricParamsBuilder.build(networkRequests = summary)
    assertEquals(2, params["expo.network.requests.count"])
    assertNull(params["expo.network.requests.slowest.timeToFirstByte"])
    assertNull(params["expo.network.requests.throughputBytesPerSecond"])
  }

  @Test
  fun `omits slowest keys when the summary has counts but missing slowest fields`() {
    val summary = NetworkRequestSummary(
      count = 1,
      failed = 0,
      bytesReceived = 0,
      bytesSent = 0,
      totalDuration = 0.1,
      slowest = null
    )
    val params = MetricParamsBuilder.build(networkRequests = summary)
    assertEquals(1, params["expo.network.requests.count"])
    assertNull(params["expo.network.requests.slowest.duration"])
    assertNull(params["expo.network.requests.slowest.host"])
  }
}
