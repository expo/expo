package expo.modules.sensors

import io.github.expo.modules.v2.Record
import kotlin.time.Duration

/** A reading of a sensor that measures along the x, y and z axes. */
@Record
internal data class ThreeAxisSensorEvent(
  val x: Float,
  val y: Float,
  val z: Float,
  val timestamp: Duration
)

@Record
internal data class BarometerEvent(
  val pressure: Float,
  val relativeAltitude: Float,
  val timestamp: Duration
)

@Record
internal data class LightSensorEvent(
  val illuminance: Float,
  val timestamp: Duration
)

@Record
internal data class RotationSensorEvent(
  val alpha: Float,
  val beta: Float,
  val gamma: Float,
  val timestamp: Duration
)

@Record
internal data class DeviceMotionEvent(
  val acceleration: ThreeAxisSensorEvent?,
  val accelerationIncludingGravity: ThreeAxisSensorEvent?,
  val rotation: RotationSensorEvent?,
  val rotationRate: RotationSensorEvent?,
  val interval: Double,
  val orientation: Int
)

@Record
internal data class PedometerResult(
  val steps: Int
)

@Record
internal data class PedometerActivityEvent(
  val type: String,
  val date: Duration
)
