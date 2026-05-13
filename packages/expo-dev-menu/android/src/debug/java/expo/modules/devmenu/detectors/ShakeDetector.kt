package expo.modules.devmenu.detectors

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import java.util.concurrent.TimeUnit
import kotlin.math.abs

/**
 * Number of nanoseconds that must elapse before we start detecting next gesture.
 */
private val MIN_TIME_AFTER_SHAKE_NS = TimeUnit.NANOSECONDS.convert(600, TimeUnit.MILLISECONDS)

/**
 * Required force to constitute a rage shake. Need to multiply gravity by 1.33 because a rage
 * shake in one direction should have more force than just the magnitude of free fall.
 */
private const val REQUIRED_FORCE = SensorManager.GRAVITY_EARTH * 1.33f

/**
 * Listens for the user shaking their phone. Allocation-less once it starts listening.
 */
class ShakeDetector(private val shakeListener: () -> Unit) : SensorEventListener {
  private var accelerationX = 0F
  private var accelerationY = 0F
  private var accelerationZ = 0F

  private var sensorManager: SensorManager? = null
  private var numShakes = 0

  private var lastDispatchedShakeTimestamp = 0L

  var minRecordedShakes = 3

  //region publics

  /**
   * Start listening for shakes.
   */
  fun start(manager: SensorManager) {
    manager
      .getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
      ?.let {
        sensorManager = manager
        manager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        lastDispatchedShakeTimestamp = 0
        reset()
      }
  }

  /**
   * Stop listening for shakes.
   */
  fun stop() {
    sensorManager?.unregisterListener(this)
    sensorManager = null
  }

  //endregion publics
  //region SensorEventListener

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    if (sensorEvent.timestamp - lastDispatchedShakeTimestamp < MIN_TIME_AFTER_SHAKE_NS) {
      return
    }

    val ax = sensorEvent.values[0]
    val ay = sensorEvent.values[1]
    val az = sensorEvent.values[2] - SensorManager.GRAVITY_EARTH

    when {
      atLeastRequiredForce(ax) && ax * accelerationX <= 0 -> {
        numShakes++
        accelerationX = ax
      }
      atLeastRequiredForce(ay) && ay * accelerationY <= 0 -> {
        numShakes++
        accelerationY = ay
      }
      atLeastRequiredForce(az) && az * accelerationZ <= 0 -> {
        numShakes++
        accelerationZ = az
      }
    }

    if (numShakes >= minRecordedShakes) {
      reset()
      shakeListener.invoke()
      lastDispatchedShakeTimestamp = sensorEvent.timestamp
    }
  }

  override fun onAccuracyChanged(sensor: Sensor, i: Int) {}

  //endregion SensorEventListener
  //region internals

  /** Reset all variables used to keep track of number of shakes recorded.  */
  private fun reset() {
    numShakes = 0
    accelerationX = 0f
    accelerationY = 0f
    accelerationZ = 0f
  }

  /**
   * Determine if acceleration applied to sensor is large enough to count as a rage shake.
   *
   * @param a acceleration in x, y, or z applied to the sensor
   * @return true if the magnitude of the force exceeds the minimum required amount of force. false
   * otherwise.
   */
  private fun atLeastRequiredForce(a: Float) = abs(a) > REQUIRED_FORCE

  //endregion internals
}
