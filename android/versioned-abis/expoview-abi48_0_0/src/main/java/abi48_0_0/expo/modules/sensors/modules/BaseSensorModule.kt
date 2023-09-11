package abi48_0_0.expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.os.Bundle
import android.util.Log
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import abi48_0_0.expo.modules.core.ExportedModule
import abi48_0_0.expo.modules.core.ModuleRegistry
import abi48_0_0.expo.modules.core.interfaces.LifecycleEventListener
import abi48_0_0.expo.modules.core.interfaces.services.EventEmitter
import abi48_0_0.expo.modules.core.interfaces.services.UIManager

abstract class BaseSensorModule internal constructor(context: Context?) : ExportedModule(context), SensorEventListener2, LifecycleEventListener {
  lateinit var moduleRegistry: ModuleRegistry
    private set
  private val sensorKernelServiceSubscription: SensorServiceSubscriptionInterface by lazy {
    getSensorService().createSubscriptionForListener(this)
  }
  private var mIsObserving = false

  protected abstract val eventName: String
  protected abstract fun getSensorService(): SensorServiceInterface
  protected abstract fun eventToMap(sensorEvent: SensorEvent): Bundle

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry

    // Unregister from old UIManager
    moduleRegistry.getModule(UIManager::class.java)?.unregisterLifecycleEventListener(this)

    // Register to new UIManager
    moduleRegistry.getModule(UIManager::class.java)?.registerLifecycleEventListener(this)
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)
    eventEmitter?.emit(eventName, eventToMap(sensorEvent))
      ?: Log.e("E_SENSOR_MODULE", "Could not emit $eventName event, no event emitter present.")
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  override fun onFlushCompleted(sensor: Sensor) = Unit

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

  override fun onHostResume() {
    if (mIsObserving) {
      sensorKernelServiceSubscription.start()
    }
  }

  override fun onHostPause() {
    if (mIsObserving) {
      sensorKernelServiceSubscription.stop()
    }
  }

  override fun onHostDestroy() {
    sensorKernelServiceSubscription.release()
  }
}
