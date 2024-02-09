package expo.modules.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Bundle
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import java.lang.ref.WeakReference

internal typealias SensorServiceFactory = () -> SensorServiceInterface
internal typealias OnNewEvent = (event: SensorEvent) -> Unit

class SensorProxy(
  val sensorServiceFactory: SensorServiceFactory,
  val onNewEvent: OnNewEvent
) : SensorEventListener2 {

  private val sensorKernelServiceSubscription: SensorServiceSubscriptionInterface by lazy {
    sensorServiceFactory().createSubscriptionForListener(this)
  }

  private var mIsObserving = false

  override fun onSensorChanged(event: SensorEvent) {
    onNewEvent(event)
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  override fun onFlushCompleted(sensor: Sensor?) = Unit

  fun setUpdateInterval(updateInterval: Int) {
    sensorKernelServiceSubscription.updateInterval = updateInterval.toLong()
  }

  fun startObserving() {
    mIsObserving = true
    sensorKernelServiceSubscription.start()
  }

  fun stopObserving() {
    if (mIsObserving) {
      mIsObserving = false
      sensorKernelServiceSubscription.stop()
    }
  }

  fun onHostResume() {
    if (mIsObserving) {
      sensorKernelServiceSubscription.start()
    }
  }

  fun onHostPause() {
    if (mIsObserving) {
      sensorKernelServiceSubscription.stop()
    }
  }

  fun onHostDestroy() {
    sensorKernelServiceSubscription.release()
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

  AsyncFunction("isAvailableAsync") {
    val sensorManager = module.appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    sensorManager?.getDefaultSensor(sensorType) != null
  }
}

internal inline fun <reified T : SensorServiceInterface> Module.createSensorProxy(
  eventName: String,
  crossinline eventMapper: (sensorEvent: SensorEvent) -> Bundle
): SensorProxy {
  val weakModule = WeakReference(this)
  val serviceFactory: SensorServiceFactory = {
    weakModule.get()?.appContext.getServiceInterface<T>()
  }
  val onNewEvent: OnNewEvent = { sensorEvent: SensorEvent ->
    weakModule.get()?.sendEvent(eventName, eventMapper(sensorEvent))
  }
  return SensorProxy(serviceFactory, onNewEvent)
}

internal inline fun <reified T : SensorServiceInterface> AppContext?.getServiceInterface(): T {
  return this?.legacyModule<T>() ?: throw ServiceNotFoundException(T::class)
}
