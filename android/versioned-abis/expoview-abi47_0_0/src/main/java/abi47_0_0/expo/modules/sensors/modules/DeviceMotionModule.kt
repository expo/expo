package abi47_0_0.expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Bundle
import android.view.Choreographer
import android.view.Surface
import android.view.WindowManager
import abi47_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import abi47_0_0.expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import abi47_0_0.expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import abi47_0_0.expo.modules.interfaces.sensors.services.GravitySensorServiceInterface
import abi47_0_0.expo.modules.interfaces.sensors.services.GyroscopeServiceInterface
import abi47_0_0.expo.modules.interfaces.sensors.services.LinearAccelerationSensorServiceInterface
import abi47_0_0.expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod
import abi47_0_0.expo.modules.core.interfaces.services.EventEmitter
import abi47_0_0.expo.modules.core.interfaces.services.UIManager

class DeviceMotionModule(context: Context?) : ExportedModule(context), SensorEventListener2 {
  private var mLastUpdate: Long = 0
  private var mUpdateInterval = 1.0f / 60.0f
  private val mRotationMatrix = FloatArray(9)
  private val mRotationResult = FloatArray(3)
  private var mAccelerationEvent: SensorEvent? = null
  private var mAccelerationIncludingGravityEvent: SensorEvent? = null
  private var mRotationEvent: SensorEvent? = null
  private var mRotationRateEvent: SensorEvent? = null
  private var mGravityEvent: SensorEvent? = null
  private lateinit var mServiceSubscriptions: MutableList<SensorServiceSubscriptionInterface>
  private lateinit var mUIManager: UIManager
  private lateinit var mModuleRegistry: ModuleRegistry

  private val mCurrentFrameCallback: ScheduleDispatchFrameCallback = ScheduleDispatchFrameCallback()
  private val mDispatchEventRunnable = DispatchEventRunnable()
  private lateinit var mEventEmitter: EventEmitter

  override fun getName(): String = "ExponentDeviceMotion"

  override fun getConstants(): Map<String, Any> {
    // Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
    return mapOf(Pair("Gravity", 9.80665))
  }

  @ExpoMethod
  fun setUpdateInterval(updateInterval: Int, promise: Promise) {
    mUpdateInterval = updateInterval.toFloat()
    promise.resolve(null)
  }

  @ExpoMethod
  fun startObserving(promise: Promise) {
    if (!this::mServiceSubscriptions.isInitialized) {
      mServiceSubscriptions = ArrayList()
      for (kernelService in getSensorKernelServices()) {
        val subscription = kernelService.createSubscriptionForListener(this)
        // We want handle update interval on our own,
        // because we need to coordinate updates from multiple sensor services.
        subscription.updateInterval = 0
        mServiceSubscriptions.add(subscription)
      }
    }
    mServiceSubscriptions.forEach { it.start() }
    promise.resolve(null)
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    mUIManager.runOnUiQueueThread {
      mServiceSubscriptions.forEach { it.stop() }
      mCurrentFrameCallback.stop()
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun isAvailableAsync(promise: Promise) {
    val mSensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val sensorTypes = arrayListOf(Sensor.TYPE_GYROSCOPE, Sensor.TYPE_ACCELEROMETER, Sensor.TYPE_LINEAR_ACCELERATION, Sensor.TYPE_ROTATION_VECTOR, Sensor.TYPE_GRAVITY)
    for (type in sensorTypes) {
      if (mSensorManager.getDefaultSensor(type!!) == null) {
        promise.resolve(false)
        return
      }
    }
    promise.resolve(true)
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter::class.java)
    mUIManager = moduleRegistry.getModule(UIManager::class.java)
    mModuleRegistry = moduleRegistry
  }

  private fun getSensorKernelServices(): List<SensorServiceInterface> {
    return arrayListOf(
      mModuleRegistry.getModule(GyroscopeServiceInterface::class.java),
      mModuleRegistry.getModule(LinearAccelerationSensorServiceInterface::class.java),
      mModuleRegistry.getModule(AccelerometerServiceInterface::class.java),
      mModuleRegistry.getModule(RotationVectorSensorServiceInterface::class.java),
      mModuleRegistry.getModule(GravitySensorServiceInterface::class.java)
    )
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val sensor = sensorEvent.sensor
    when (sensor.type) {
      Sensor.TYPE_GYROSCOPE -> mRotationRateEvent = sensorEvent
      Sensor.TYPE_ACCELEROMETER -> mAccelerationIncludingGravityEvent = sensorEvent
      Sensor.TYPE_LINEAR_ACCELERATION -> mAccelerationEvent = sensorEvent
      Sensor.TYPE_ROTATION_VECTOR -> mRotationEvent = sensorEvent
      Sensor.TYPE_GRAVITY -> mGravityEvent = sensorEvent
    }
    mCurrentFrameCallback.maybePostFromNonUI()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  override fun onFlushCompleted(sensor: Sensor) = Unit

  private inner class ScheduleDispatchFrameCallback : Choreographer.FrameCallback {
    @Volatile
    private var mIsPosted = false
    private var mShouldStop = false

    override fun doFrame(frameTimeNanos: Long) {
      if (mShouldStop) {
        mIsPosted = false
      } else {
        post()
      }
      val curTime = System.currentTimeMillis()
      if (curTime - mLastUpdate > mUpdateInterval) {
        mUIManager.runOnClientCodeQueueThread(mDispatchEventRunnable)
        mLastUpdate = curTime
      }
    }

    fun stop() {
      mShouldStop = true
    }

    fun maybePost() {
      if (!mIsPosted) {
        mIsPosted = true
        post()
      }
    }

    private fun post() {
      Choreographer.getInstance().postFrameCallback(mCurrentFrameCallback)
    }

    fun maybePostFromNonUI() {
      if (mIsPosted) {
        return
      }
      mUIManager.runOnUiQueueThread { maybePost() }
    }
  }

  private inner class DispatchEventRunnable : Runnable {
    override fun run() {
      mEventEmitter.emit("deviceMotionDidUpdate", eventsToMap())
    }
  }

  private fun eventsToMap(): Bundle {
    val map = Bundle()
    var interval = 0.0
    if (mAccelerationEvent != null) {
      map.putBundle(
        "acceleration",
        Bundle().apply {
          putDouble("x", mAccelerationEvent!!.values[0].toDouble())
          putDouble("y", mAccelerationEvent!!.values[1].toDouble())
          putDouble("z", mAccelerationEvent!!.values[2].toDouble())
        }
      )
      interval = mAccelerationEvent!!.timestamp.toDouble()
    }
    if (mAccelerationIncludingGravityEvent != null && mGravityEvent != null) {
      map.putBundle(
        "accelerationIncludingGravity",
        Bundle().apply {
          putDouble("x", (mAccelerationIncludingGravityEvent!!.values[0] - 2 * mGravityEvent!!.values[0]).toDouble())
          putDouble("y", (mAccelerationIncludingGravityEvent!!.values[1] - 2 * mGravityEvent!!.values[1]).toDouble())
          putDouble("z", (mAccelerationIncludingGravityEvent!!.values[2] - 2 * mGravityEvent!!.values[2]).toDouble())
        }
      )
      interval = mAccelerationIncludingGravityEvent!!.timestamp.toDouble()
    }
    if (mRotationRateEvent != null) {
      map.putBundle(
        "rotationRate",
        Bundle().apply {
          putDouble("alpha", Math.toDegrees(mRotationRateEvent!!.values[0].toDouble()))
          putDouble("beta", Math.toDegrees(mRotationRateEvent!!.values[1].toDouble()))
          putDouble("gamma", Math.toDegrees(mRotationRateEvent!!.values[2].toDouble()))
        }
      )
      interval = mRotationRateEvent!!.timestamp.toDouble()
    }
    if (mRotationEvent != null) {
      SensorManager.getRotationMatrixFromVector(mRotationMatrix, mRotationEvent!!.values)
      SensorManager.getOrientation(mRotationMatrix, mRotationResult)
      map.putBundle(
        "rotation",
        Bundle().apply {
          putDouble("alpha", (-mRotationResult[0]).toDouble())
          putDouble("beta", (-mRotationResult[1]).toDouble())
          putDouble("gamma", mRotationResult[2].toDouble())
        }
      )
      interval = mRotationEvent!!.timestamp.toDouble()
    }
    map.putDouble("interval", interval)
    map.putInt("orientation", getOrientation())
    return map
  }

  private fun getOrientation(): Int {
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager?
    if (windowManager != null) {
      when (windowManager.defaultDisplay.rotation) {
        Surface.ROTATION_0 -> return 0
        Surface.ROTATION_90 -> return 90
        Surface.ROTATION_180 -> return 180
        Surface.ROTATION_270 -> return -90
        else -> {
        }
      }
    }
    return 0
  }
}
