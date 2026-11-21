package expo.modules.sensors

import android.hardware.SensorEvent
import android.hardware.SensorManager
import kotlin.math.PI
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

private fun radiansToDegrees(radians: Float): Float {
  return radians * (180f / PI.toFloat())
}

internal fun SensorEvent.timestampToDuration(): Duration =
  timestamp.toDuration(DurationUnit.NANOSECONDS)

internal fun SensorEvent.toThreeAxisSensorEvent(divisor: Float = 1f) = ThreeAxisSensorEvent(
  x = values[0] / divisor,
  y = values[1] / divisor,
  z = values[2] / divisor,
  timestamp = timestampToDuration()
)

internal fun SensorEvent.toRotationRateEvent() = RotationSensorEvent(
  alpha = radiansToDegrees(values[0]),
  beta = radiansToDegrees(values[1]),
  gamma = radiansToDegrees(values[2]),
  timestamp = timestampToDuration()
)

internal fun SensorEvent.toRotationEvent(
  rotationMatrix: FloatArray = FloatArray(9),
  orientation: FloatArray = FloatArray(3)
): RotationSensorEvent {
  SensorManager.getRotationMatrixFromVector(rotationMatrix, values)
  SensorManager.getOrientation(rotationMatrix, orientation)
  return RotationSensorEvent(
    alpha = -orientation[0],
    beta = -orientation[1],
    gamma = orientation[2],
    timestamp = timestampToDuration()
  )
}

internal fun SensorEvent.toLightSensorEvent() = LightSensorEvent(
  illuminance = values[0],
  timestamp = timestampToDuration()
)

internal fun SensorEvent.toBarometerEvent(referencePressure: Float) = BarometerEvent(
  pressure = values[0],
  relativeAltitude = SensorManager.getAltitude(referencePressure, values[0]),
  timestamp = timestampToDuration()
)

internal fun SensorEvent.toPedometerResult(initialSteps: Int) = PedometerResult(
  steps = values[0].toInt() - initialSteps
)
