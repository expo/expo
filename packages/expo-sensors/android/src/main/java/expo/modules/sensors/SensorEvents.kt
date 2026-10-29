package expo.modules.sensors

import io.github.expo.modules.v2.Record

/** A reading of a sensor that measures along the x, y and z axes. */
@Record
internal data class ThreeAxisSensorEvent(
  val x: Double,
  val y: Double,
  val z: Double,
  val timestamp: Double
)

@Record
internal data class BarometerEvent(
  val pressure: Double,
  val timestamp: Double
)

@Record
internal data class LightSensorEvent(
  val illuminance: Double,
  val timestamp: Double
)
