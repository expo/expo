package expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Bundle
import android.view.Choreographer
import android.view.Surface
import android.view.WindowManager
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import expo.modules.interfaces.sensors.services.GravitySensorServiceInterface
import expo.modules.interfaces.sensors.services.GyroscopeServiceInterface
import expo.modules.interfaces.sensors.services.LinearAccelerationSensorServiceInterface
import expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.services.EventEmitter
import org.unimodules.core.interfaces.services.UIManager
import java.util.*

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
  private var mServiceSubscriptions: MutableList<SensorServiceSubscriptionInterface>? = null
  private var mUiManager: UIManager? = null
  private var mModuleRegistry: ModuleRegistry? = null
  override fun getName(): String {
    return "ExponentDeviceMotion"
  }

  override fun getConstants(): Map<String, Any> {
    return Collections.unmodifiableMap(object : HashMap<String?, Any?>() {
      init {
        // Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
        put("Gravity", 9.80665)
      }
    })
  }

  @ExpoMethod
  fun setUpdateInterval(updateInterval: Int, promise: Promise) {
    mUpdateInterval = updateInterval.toFloat()
    promise.resolve(null)
  }

  @ExpoMethod
  fun startObserving(promise: Promise) {
    if (mServiceSubscriptions == null) {
      mServiceSubscriptions = ArrayList()
      for (kernelService in sensorKernelServices) {
        val subscription = kernelService.createSubscriptionForListener(this)
        // We want handle update interval on our own,
        // because we need to coordinate updates from multiple sensor services.
        subscription.setUpdateInterval(0)
        mServiceSubscriptions.add(subscription)
      }
    }
    for (subscription in mServiceSubscriptions!!) {
      subscription.start()
    }
    promise.resolve(null)
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    mUiManager!!.runOnUiQueueThread {
      for (subscription in mServiceSubscriptions!!) {
        subscription.stop()
      }
      mCurrentFrameCallback.stop()
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun isAvailableAsync(promise: Promise) {
    val mSensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val sensorTypes = ArrayList(Arrays.asList(Sensor.TYPE_GYROSCOPE, Sensor.TYPE_ACCELEROMETER, Sensor.TYPE_LINEAR_ACCELERATION, Sensor.TYPE_ROTATION_VECTOR, Sensor.TYPE_GRAVITY))
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
    mUiManager = moduleRegistry.getModule(UIManager::class.java)
    mModuleRegistry = moduleRegistry
  }

  private val sensorKernelServices: List<SensorServiceInterface>
    private get() = Arrays.asList(
        mModuleRegistry!!.getModule(GyroscopeServiceInterface::class.java),
        mModuleRegistry!!.getModule(LinearAccelerationSensorServiceInterface::class.java),
        mModuleRegistry!!.getModule(AccelerometerServiceInterface::class.java),
        mModuleRegistry!!.getModule(RotationVectorSensorServiceInterface::class.java),
        mModuleRegistry!!.getModule(GravitySensorServiceInterface::class.java)
    )

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val sensor = sensorEvent.sensor
    if (sensor.type == Sensor.TYPE_GYROSCOPE) {
      mRotationRateEvent = sensorEvent
    } else if (sensor.type == Sensor.TYPE_ACCELEROMETER) {
      mAccelerationIncludingGravityEvent = sensorEvent
    } else if (sensor.type == Sensor.TYPE_LINEAR_ACCELERATION) {
      mAccelerationEvent = sensorEvent
    } else if (sensor.type == Sensor.TYPE_ROTATION_VECTOR) {
      mRotationEvent = sensorEvent
    } else if (sensor.type == Sensor.TYPE_GRAVITY) {
      mGravityEvent = sensorEvent
    }
    mCurrentFrameCallback.maybePostFromNonUI()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
    // do nothing
  }

  override fun onFlushCompleted(sensor: Sensor) {
    // do nothing
  }

  private val mCurrentFrameCallback: ScheduleDispatchFrameCallback = ScheduleDispatchFrameCallback()
  private val mDispatchEventRunnable = DispatchEventRunnable()
  private var mEventEmitter: EventEmitter? = null

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
        mUiManager!!.runOnClientCodeQueueThread(mDispatchEventRunnable)
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
      mUiManager!!.runOnUiQueueThread { maybePost() }
    }
  }

  private inner class DispatchEventRunnable : Runnable {
    override fun run() {
      mEventEmitter!!.emit("deviceMotionDidUpdate", eventsToMap())
    }
  }

  private fun eventsToMap(): Bundle {
    val map = Bundle()
    val acceleration = Bundle()
    val accelerationIncludingGravity = Bundle()
    val rotation = Bundle()
    val rotationRate = Bundle()
    var interval = 0.0
    if (mAccelerationEvent != null) {
      acceleration.putDouble("x", mAccelerationEvent!!.values[0].toDouble())
      acceleration.putDouble("y", mAccelerationEvent!!.values[1].toDouble())
      acceleration.putDouble("z", mAccelerationEvent!!.values[2].toDouble())
      map.putBundle("acceleration", acceleration)
      interval = mAccelerationEvent!!.timestamp.toDouble()
    }
    if (mAccelerationIncludingGravityEvent != null && mGravityEvent != null) {
      accelerationIncludingGravity.putDouble("x", (mAccelerationIncludingGravityEvent!!.values[0] - 2 * mGravityEvent!!.values[0]).toDouble())
      accelerationIncludingGravity.putDouble("y", (mAccelerationIncludingGravityEvent!!.values[1] - 2 * mGravityEvent!!.values[1]).toDouble())
      accelerationIncludingGravity.putDouble("z", (mAccelerationIncludingGravityEvent!!.values[2] - 2 * mGravityEvent!!.values[2]).toDouble())
      map.putBundle("accelerationIncludingGravity", accelerationIncludingGravity)
      interval = mAccelerationIncludingGravityEvent!!.timestamp.toDouble()
    }
    if (mRotationRateEvent != null) {
      rotationRate.putDouble("alpha", Math.toDegrees(mRotationRateEvent!!.values[0].toDouble()))
      rotationRate.putDouble("beta", Math.toDegrees(mRotationRateEvent!!.values[1].toDouble()))
      rotationRate.putDouble("gamma", Math.toDegrees(mRotationRateEvent!!.values[2].toDouble()))
      map.putBundle("rotationRate", rotationRate)
      interval = mRotationRateEvent!!.timestamp.toDouble()
    }
    if (mRotationEvent != null) {
      SensorManager.getRotationMatrixFromVector(mRotationMatrix, mRotationEvent!!.values)
      SensorManager.getOrientation(mRotationMatrix, mRotationResult)
      rotation.putDouble("alpha", (-mRotationResult[0]).toDouble())
      rotation.putDouble("beta", (-mRotationResult[1]).toDouble())
      rotation.putDouble("gamma", mRotationResult[2].toDouble())
      map.putBundle("rotation", rotation)
      interval = mRotationEvent!!.timestamp.toDouble()
    }
    map.putDouble("interval", interval)
    map.putInt("orientation", orientation)
    return map
  }

  private val orientation: Int
    private get() {
      val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
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