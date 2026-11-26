package expo.modules.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Bundle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import java.lang.ref.WeakReference

internal typealias OnNewEvent = (event: SensorEvent) -> Unit

class SensorProxy(
  private val sensorType: Int,
  appContext: AppContext,
  val onNewEvent: OnNewEvent
) : SensorEventListener2 {
  private val appContextHolder = WeakReference(appContext)

  private val sensorKernelServiceSubscription: SensorSubscription by lazy {
    val context = appContextHolder.get()?.reactContext ?: throw Exceptions.ReactContextLost()
    SensorSubscription(context, sensorType, this)
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

  fun onHostResume() {
    if (isObserving) {
      sensorKernelServiceSubscription.startObserving()
    }
  }

  fun onHostPause() {
    if (isObserving) {
      sensorKernelServiceSubscription.stopObserving()
    }
  }

  fun onHostDestroy() {
    if (isObserving) {
      sensorKernelServiceSubscription.stopObserving()
      isObserving = false
    }
  }
}

@Suppress("FunctionName")
internal fun ModuleDefinitionBuilder.UseSensorProxy(
  module: Module,
  sensorType: Int,
  eventName: String,
  listenerDecorator: (() -> Unit)? = null,
  sensorProxyGetter: () -> SensorProxy
) {
  Events(eventName)

  OnStartObserving {
    listenerDecorator?.invoke()
    sensorProxyGetter().startObserving()
  }

  OnStopObserving {
    listenerDecorator?.invoke()
    sensorProxyGetter().stopObserving()
  }

  OnActivityEntersForeground {
    sensorProxyGetter().onHostResume()
  }

  OnActivityEntersBackground {
    sensorProxyGetter().onHostPause()
  }

  OnActivityDestroys {
    sensorProxyGetter().onHostDestroy()
  }

  OnDestroy {
    sensorProxyGetter().onHostDestroy()
  }

  AsyncFunction("setUpdateInterval") { updateInterval: Int ->
    sensorProxyGetter().setUpdateInterval(updateInterval)
  }

  AsyncFunction<Boolean>("isAvailableAsync") {
    val sensorManager = module.appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    sensorManager?.getDefaultSensor(sensorType) != null
  }
}

internal inline fun Module.createSensorProxy(
  eventName: String,
  sensorType: Int,
  appContext: AppContext,
  crossinline eventMapper: (sensorEvent: SensorEvent) -> Bundle
): SensorProxy {
  val weakModule = WeakReference(this)

  val onNewEvent: OnNewEvent = { sensorEvent: SensorEvent ->
    weakModule.get()?.sendEvent(eventName, eventMapper(sensorEvent))
  }
  return SensorProxy(sensorType, appContext, onNewEvent)
}
