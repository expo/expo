package expo.modules.appmetrics.utils

import expo.modules.appmetrics.frames.FrameMetricsRecord
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
}
