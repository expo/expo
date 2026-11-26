package expo.modules.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import com.facebook.react.bridge.LifecycleEventListener
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull

internal typealias OnNewEvent = (event: SensorEvent) -> Unit

class SensorProxy(
  private val sensorType: Int,
  private val contextProvider: () -> Context,
  val onNewEvent: OnNewEvent
) : SensorEventListener2, LifecycleEventListener {
  private val sensorKernelServiceSubscription: SensorSubscription by lazy {
    SensorSubscription(contextProvider(), sensorType, this)
  }

  val isAvailable: Boolean
    get() {
      val sensorManager = contextProvider().getSystemService(Context.SENSOR_SERVICE) as? SensorManager
      return sensorManager?.getDefaultSensor(sensorType) != null
    }

  private var isObserving = false

  override fun onSensorChanged(event: SensorEvent) {
    onNewEvent(event)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  override fun onFlushCompleted(sensor: Sensor?) = Unit

  fun setUpdateInterval(updateInterval: Int) {
    sensorKernelServiceSubscription.updateInterval = updateInterval.toLong()
  }

  fun startObserving() {
    isObserving = true
    sensorKernelServiceSubscription.startObserving()
  }

  fun stopObserving() {
    if (isObserving) {
      isObserving = false
      sensorKernelServiceSubscription.stopObserving()
    }
  }

  override fun onHostResume() {
    if (isObserving) {
      sensorKernelServiceSubscription.startObserving()
    }
  }

  override fun onHostPause() {
    if (isObserving) {
      sensorKernelServiceSubscription.stopObserving()
    }
  }

  override fun onHostDestroy() {
    if (isObserving) {
      sensorKernelServiceSubscription.stopObserving()
      isObserving = false
    }
  }
}

internal fun Module.createSensorProxy(sensorType: Int, onNewEvent: OnNewEvent): SensorProxy =
  SensorProxy(sensorType, { androidContext }, onNewEvent)

/**
 * Starts the sensor for a module on the Expo Modules API 2.0. Such a module gets no activity
 * lifecycle events, so the proxy listens to React Native's to pause the sensor in the background.
 */
internal fun Module.startObserving(sensorProxy: SensorProxy) {
  reactContext.addLifecycleEventListener(sensorProxy)
  sensorProxy.startObserving()
}

internal fun Module.stopObserving(sensorProxy: SensorProxy) {
  reactContextOrNull?.removeLifecycleEventListener(sensorProxy)
  sensorProxy.stopObserving()
}
