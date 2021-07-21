package expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.os.Bundle
import android.util.Log
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.EventEmitter
import org.unimodules.core.interfaces.services.UIManager

abstract class BaseSensorModule internal constructor(context: Context?) : ExportedModule(context), SensorEventListener2, LifecycleEventListener {
  private var mSensorServiceSubscription: SensorServiceSubscriptionInterface? = null
  var moduleRegistry: ModuleRegistry? = null
    private set
  private var mIsObserving = false
  protected abstract val eventName: String
  protected abstract val sensorService: SensorServiceInterface
  protected abstract fun eventToMap(sensorEvent: SensorEvent?): Bundle?
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    // Unregister from old UIManager
    if (this.moduleRegistry != null && moduleRegistry.getModule(UIManager::class.java) != null) {
      moduleRegistry.getModule(UIManager::class.java).unregisterLifecycleEventListener(this)
    }
    this.moduleRegistry = moduleRegistry

    // Register to new UIManager
    if (this.moduleRegistry != null && moduleRegistry.getModule(UIManager::class.java) != null) {
      moduleRegistry.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    }
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val eventEmitter = moduleRegistry!!.getModule(EventEmitter::class.java)
    eventEmitter?.emit(eventName, eventToMap(sensorEvent))
        ?: Log.e("E_SENSOR_MODULE", "Could not emit $eventName event, no event emitter present.")
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
    // do nothing
  }

  override fun onFlushCompleted(sensor: Sensor) {
    // do nothing
  }

  fun setUpdateInterval(updateInterval: Int) {
    sensorKernelServiceSubscription!!.updateInterval = updateInterval.toLong()
  }

  private val sensorKernelServiceSubscription: SensorServiceSubscriptionInterface?
    private get() {
      if (mSensorServiceSubscription != null) {
        return mSensorServiceSubscription
      }
      mSensorServiceSubscription = sensorService.createSubscriptionForListener(this)
      return mSensorServiceSubscription
    }

  fun startObserving() {
    mIsObserving = true
    sensorKernelServiceSubscription!!.start()
  }

  fun stopObserving() {
    if (mIsObserving) {
      mIsObserving = false
      sensorKernelServiceSubscription!!.stop()
    }
  }

  override fun onHostResume() {
    if (mIsObserving) {
      sensorKernelServiceSubscription!!.start()
    }
  }

  override fun onHostPause() {
    if (mIsObserving) {
      sensorKernelServiceSubscription!!.stop()
    }
  }

  override fun onHostDestroy() {
    sensorKernelServiceSubscription!!.release()
  }
}