package expo.modules.location.next

import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.UpdatesSession
import kotlin.math.abs

@OptimizedRecord
class Heading(
  @Field val trueHeading: Double? = null,
  @Field val magneticHeading: Double,
  @Field val accuracy: Double? = null,
  @Field val timestamp: Double
) : Record

internal fun Position.declination(): Double {
  return GeomagneticField(
    coordinates.latitude.toFloat(),
    coordinates.longitude.toFloat(),
    (altitude ?: 0.0).toFloat(),
    System.currentTimeMillis()
  ).declination.toDouble()
}

data class WatchHeadingParameters(val filter: Double)

private fun normalizedDegrees(degrees: Double): Double = (degrees % 360.0 + 360.0) % 360.0

private fun angularDistance(from: Double, to: Double): Double = abs((to - from + 540.0) % 360.0 - 180.0)

internal fun validatedHeadingFilter(degrees: Double): Double {
  if (!degrees.isFinite() || degrees < 0.0) {
    throw InvalidHeadingFilterException()
  }
  return degrees
}

class HeadingUpdatesSession(
  private val sensorManager: SensorManager
) : UpdatesSession<WatchHeadingParameters>, SensorEventListener {

  @Volatile
  private var onUpdate: ((WatchEvent) -> Unit)? = null
  private var filter: Double = DEFAULT_HEADING_FILTER
  private var lastEmittedHeading: Double? = null

  private fun rotationVectorSensor(): Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

  private fun clearSubscription() {
    if (onUpdate != null) {
      onUpdate = null
      sensorManager.unregisterListener(this)
    }
  }

  @Synchronized
  private fun acceptReading(event: SensorEvent): Heading? {
    if (onUpdate == null) {
      return null
    }
    val rotationMatrix = FloatArray(9)
    SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
    val orientation = FloatArray(3)
    SensorManager.getOrientation(rotationMatrix, orientation)
    val magneticHeading = normalizedDegrees(Math.toDegrees(orientation[0].toDouble()))

    val lastHeading = lastEmittedHeading
    if (lastHeading != null && angularDistance(lastHeading, magneticHeading) < filter) {
      return null
    }
    lastEmittedHeading = magneticHeading

    val accuracy = event.values
      .getOrNull(4)
      ?.takeIf { it >= 0f }
      ?.let { Math.toDegrees(it.toDouble()) }
    return Heading(
      trueHeading = LocationModuleNext.headingDeclination?.let { normalizedDegrees(magneticHeading + it) },
      magneticHeading = magneticHeading,
      accuracy = accuracy,
      timestamp = System.currentTimeMillis().toDouble()
    )
  }

  @Synchronized
  override fun startUpdates(parameters: WatchHeadingParameters, onUpdate: (WatchEvent) -> Unit) {
    clearSubscription()
    val sensor = rotationVectorSensor() ?: throw HeadingUnavailableException()
    if (!sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)) {
      throw HeadingUpdatesFailedException("The device could not start reading the rotation vector sensor. Call resume() or restart() to try again")
    }
    filter = parameters.filter
    lastEmittedHeading = null
    this.onUpdate = onUpdate
  }

  @Synchronized
  override fun stopUpdates() {
    clearSubscription()
  }

  @Synchronized
  override fun isSubscribed(): Boolean = onUpdate != null

  override fun canDeliverUpdates(): Boolean = rotationVectorSensor() != null

  override fun onSensorChanged(event: SensorEvent?) {
    event ?: return
    val onUpdate = this.onUpdate ?: return
    val heading = acceptReading(event) ?: return
    onUpdate(WatchEvent(data = heading))
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    if (accuracy != SensorManager.SENSOR_STATUS_UNRELIABLE) {
      return
    }
    onUpdate?.invoke(HeadingUpdatesFailedException("The heading sensor is unreliable, usually because of magnetic interference. Ask the user to move the device away from it and calibrate the compass").toWatchEvent())
  }
}

class HeadingWatchHandle(override val session: PausableWatchSession<WatchHeadingParameters>) : WatchHandle(HEADING_CHANGED)

class HeadingUnavailableException :
  CodedException("This device has no rotation vector sensor, so it cannot report its heading. Catch this error where the app starts watching the heading, and hide compass features on this device")
class InvalidHeadingFilterException : CodedException("Heading filter must be a finite, non-negative number of degrees")
class HeadingUpdatesFailedException(message: String) : CodedException(message)
