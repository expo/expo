package expo.modules.devmenu.detectors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorManager
import androidx.test.core.app.ApplicationProvider.getApplicationContext
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowSensor
import org.robolectric.shadows.ShadowSensorManager
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
internal class ShakeDetectorTest {
  @Test
  fun `checks if ShakeDetector calls listener on shake`() {
    var detectedShakes = 0
    val detector = ShakeDetector {
      detectedShakes++
    }

    val events = craftShakeEvent()
    for (event in events) {
      detector.onSensorChanged(event)
    }

    Truth.assertThat(detectedShakes).isEqualTo(1)
  }

  @Test
  fun `checks if ShakeDetector respects elapse time between gestures`() {
    var detectedShakes = 0
    val detector = ShakeDetector {
      detectedShakes++
    }

    val events = craftShakeEvent() + craftShakeEvent()
    for (event in events) {
      detector.onSensorChanged(event)
    }

    Truth.assertThat(detectedShakes).isEqualTo(1)
  }

  @Test
  fun `checks if ShakeDetector detects multiple gestures`() {
    var detectedShakes = 0
    val detector = ShakeDetector {
      detectedShakes++
    }

    val events = craftShakeEvent() + craftShakeEvent(time = TimeUnit.NANOSECONDS.convert(800, TimeUnit.MILLISECONDS))
    for (event in events) {
      detector.onSensorChanged(event)
    }

    Truth.assertThat(detectedShakes).isEqualTo(2)
  }

  @Test
  fun `checks if ShakeDetector respects shake force`() {
    var detectedShakes = 0
    val detector = ShakeDetector {
      detectedShakes++
    }

    val events = craftShakeEvent(force = SensorManager.GRAVITY_EARTH)
    for (event in events) {
      detector.onSensorChanged(event)
    }

    Truth.assertThat(detectedShakes).isEqualTo(0)
  }

  @Test
  fun `checks if ShakeDetector registers itself`() {
    val detector = ShakeDetector {}
    val sensorManager = getApplicationContext<Context>().getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val shadow = shadowOf(sensorManager)
    shadow.addSensor(ShadowSensor.newInstance(Sensor.TYPE_ACCELEROMETER))

    detector.start(sensorManager)

    Truth.assertThat(shadow.listeners).contains(detector)
  }

  @Test
  fun `checks if ShakeDetector can be stopped`() {
    val detector = ShakeDetector {}
    val sensorManager = getApplicationContext<Context>().getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val shadow = shadowOf(sensorManager)
    shadow.addSensor(ShadowSensor.newInstance(Sensor.TYPE_ACCELEROMETER))

    detector.start(sensorManager)
    detector.stop()

    Truth.assertThat(shadow.listeners).doesNotContain(detector)
  }

  @Test
  fun `checks if ShakeDetector listens to system events`() {
    var detectedShakes = 0
    val detector = ShakeDetector {
      detectedShakes++
    }
    val sensorManager = getApplicationContext<Context>().getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val shadow = shadowOf(sensorManager)
    shadow.addSensor(ShadowSensor.newInstance(Sensor.TYPE_ACCELEROMETER))

    detector.start(sensorManager)
    val events = craftShakeEvent()
    for (event in events) {
      shadow.sendSensorEventToListeners(event)
    }
    detector.stop()

    Truth.assertThat(shadow.listeners).doesNotContain(detector)
    Truth.assertThat(detectedShakes).isEqualTo(1)
  }

  private fun craftShakeEvent(force: Float = SensorManager.GRAVITY_EARTH * 2f, time: Long = 0): List<SensorEvent> {
    return listOf(
      ShadowSensorManager.createSensorEvent(3).apply {
        timestamp = System.currentTimeMillis() + time
        values[0] = force
      },
      ShadowSensorManager.createSensorEvent(3).apply {
        timestamp = System.currentTimeMillis() + time
        values[0] = -force
      },
      ShadowSensorManager.createSensorEvent(3).apply {
        timestamp = System.currentTimeMillis() + time
        values[0] = force
      }
    )
  }
}
