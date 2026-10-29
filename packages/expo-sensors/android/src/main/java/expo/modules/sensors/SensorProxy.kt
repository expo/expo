package expo.modules.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Bundle
import com.facebook.react.bridge.LifecycleEventListener
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import java.lang.ref.WeakReference
import io.github.expo.modules.v2.Module as ModuleV2

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
  val appContextHolder = WeakReference(appContext)

  val onNewEvent: OnNewEvent = { sensorEvent: SensorEvent ->
    weakModule.get()?.sendEvent(eventName, eventMapper(sensorEvent))
  }
  return SensorProxy(
    sensorType,
    { appContextHolder.get()?.reactContext ?: throw Exceptions.ReactContextLost() },
    onNewEvent
  )
}

/**
 * Starts the sensor for a module on the Expo Modules API 2.0. Such a module gets no activity
 * lifecycle events, so the proxy listens to React Native's to pause the sensor in the background.
 */
internal fun ModuleV2.startObserving(sensorProxy: SensorProxy) {
  reactContext.addLifecycleEventListener(sensorProxy)
  sensorProxy.startObserving()
}

internal fun ModuleV2.stopObserving(sensorProxy: SensorProxy) {
  reactContextOrNull?.removeLifecycleEventListener(sensorProxy)
  sensorProxy.stopObserving()
}
