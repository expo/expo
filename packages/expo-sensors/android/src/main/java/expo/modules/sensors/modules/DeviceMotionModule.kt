package expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.view.Choreographer
import android.view.Surface
import android.view.WindowManager
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.SensorSubscription
import java.lang.ref.WeakReference
import android.Manifest
import android.util.Log
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise

private val sensorTypes = arrayListOf(
  Sensor.TYPE_GYROSCOPE,
  Sensor.TYPE_ACCELEROMETER,
  Sensor.TYPE_LINEAR_ACCELERATION,
  Sensor.TYPE_ROTATION_VECTOR,
  Sensor.TYPE_GRAVITY
)

class DeviceMotionModule : Module(), SensorEventListener2 {
  private var lastUpdate = 0L
  private var updateInterval = 1.0f / 60.0f
  private val rotationMatrix = FloatArray(9)
  private val rotationResult = FloatArray(3)
  private var accelerationEvent: SensorEvent? = null
  private var accelerationIncludingGravityEvent: SensorEvent? = null
  private var rotationEvent: SensorEvent? = null
  private var rotationRateEvent: SensorEvent? = null
  private var gravityEvent: SensorEvent? = null
  private lateinit var uiManager: UIManager

  private val currentFrameCallback: ScheduleDispatchFrameCallback = ScheduleDispatchFrameCallback()
  private val dispatchEventRunnable = DispatchEventRunnable(WeakReference(this))

  private var isObserving = false

  private val subscriptions: List<SensorSubscription> by lazy {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    sensorTypes.map { type ->
      SensorSubscription(context, type, this, updateInterval = 0)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExponentDeviceMotion")

    Events("deviceMotionDidUpdate")

    Constant("Gravity") {
      SensorManager.GRAVITY_EARTH
    }

    OnCreate {
      uiManager = appContext.legacyModule()!!
    }

    AsyncFunction("setUpdateInterval") { updateInterval: Float ->
      this@DeviceMotionModule.updateInterval = updateInterval
    }

    AsyncFunction("getPermissionsAsync") { promise: expo.modules.kotlin.Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        Permissions.getPermissionsWithPermissionsManager(
          appContext.permissions,
          promise,
          Manifest.permission.ACTIVITY_RECOGNITION
        )
      } else {
        // Permissions don't need to be requested on Android versions below Q
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise)
      }
    }

    AsyncFunction("requestPermissionsAsync") { promise: expo.modules.kotlin.Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        Permissions.askForPermissionsWithPermissionsManager(
          appContext.permissions,
          promise,
          Manifest.permission.ACTIVITY_RECOGNITION
        )
      } else {
        // Permissions don't need to be requested on Android versions below Q
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise)
      }
    }

    OnDestroy {
      if (isObserving) {
        subscriptions.forEach { it.stopObserving() }
      }
    }

    OnStartObserving {
      subscriptions.forEach { it.startObserving() }
      isObserving = true
      currentFrameCallback.maybePostFromNonUI()
    }

    OnActivityEntersForeground {
      if (isObserving) {
        subscriptions.forEach { it.startObserving() }
      }
    }

    OnActivityEntersBackground {
      if (isObserving) {
        subscriptions.forEach { it.stopObserving() }
      }
    }

    OnStopObserving {
      if (isObserving) {
        subscriptions.forEach { it.stopObserving() }
      }
      currentFrameCallback.stop()
    }

    AsyncFunction<Boolean>("isAvailableAsync") {
      val mSensorManager = appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        ?: return@AsyncFunction false
      for (type in sensorTypes) {
        if (mSensorManager.getDefaultSensor(type) == null) {
          return@AsyncFunction false
        }
      }
      return@AsyncFunction true
    }
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val sensor = sensorEvent.sensor
    when (sensor.type) {
      Sensor.TYPE_GYROSCOPE -> rotationRateEvent = sensorEvent
      Sensor.TYPE_ACCELEROMETER -> accelerationIncludingGravityEvent = sensorEvent
      Sensor.TYPE_LINEAR_ACCELERATION -> accelerationEvent = sensorEvent
      Sensor.TYPE_ROTATION_VECTOR -> rotationEvent = sensorEvent
      Sensor.TYPE_GRAVITY -> gravityEvent = sensorEvent
    }
    currentFrameCallback.maybePostFromNonUI()
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  override fun onFlushCompleted(sensor: Sensor) = Unit

  private inner class ScheduleDispatchFrameCallback : Choreographer.FrameCallback {
    @Volatile
    private var mIsPosted = false

    @Volatile
    private var mShouldStop = false

    override fun doFrame(frameTimeNanos: Long) {
      synchronized(this) {
        if (mShouldStop) {
          mIsPosted = false
        } else {
          post()
        }
      }
      val curTime = System.currentTimeMillis()
      if (curTime - lastUpdate > updateInterval) {
        uiManager.runOnClientCodeQueueThread(dispatchEventRunnable)
        lastUpdate = curTime
      }
    }

    fun stop() = synchronized(this) {
      mShouldStop = true
    }

    fun maybePost() = synchronized(this) {
      mShouldStop = false

      if (!mIsPosted) {
        mIsPosted = true
        post()
      }
    }

    private fun post() {
      Choreographer.getInstance().postFrameCallback(currentFrameCallback)
    }

    fun maybePostFromNonUI() {
      if (mIsPosted) {
        return
      }
      uiManager.runOnUiQueueThread { maybePost() }
    }
  }

  private inner class DispatchEventRunnable(private val weakReference: WeakReference<DeviceMotionModule>) : Runnable {
    override fun run() {
      weakReference.get()?.sendEvent("deviceMotionDidUpdate", eventsToMap())
    }
  }

  private fun eventsToMap(): Bundle {
    val map = Bundle()
    if (accelerationEvent != null) {
      map.putBundle(
        "acceleration",
        Bundle().apply {
          putDouble("x", accelerationEvent!!.values[0].toDouble())
          putDouble("y", accelerationEvent!!.values[1].toDouble())
          putDouble("z", accelerationEvent!!.values[2].toDouble())
          putDouble("timestamp", accelerationEvent!!.timestamp / 1_000_000_000.0)
        }
      )
    }
    if (accelerationIncludingGravityEvent != null && gravityEvent != null) {
      map.putBundle(
        "accelerationIncludingGravity",
        Bundle().apply {
          putDouble("x", (accelerationIncludingGravityEvent!!.values[0] - 2 * gravityEvent!!.values[0]).toDouble())
          putDouble("y", (accelerationIncludingGravityEvent!!.values[1] - 2 * gravityEvent!!.values[1]).toDouble())
          putDouble("z", (accelerationIncludingGravityEvent!!.values[2] - 2 * gravityEvent!!.values[2]).toDouble())
          putDouble("timestamp", accelerationIncludingGravityEvent!!.timestamp / 1_000_000_000.0)
        }
      )
    }
    if (rotationRateEvent != null) {
      map.putBundle(
        "rotationRate",
        Bundle().apply {
          putDouble("alpha", Math.toDegrees(rotationRateEvent!!.values[0].toDouble()))
          putDouble("beta", Math.toDegrees(rotationRateEvent!!.values[1].toDouble()))
          putDouble("gamma", Math.toDegrees(rotationRateEvent!!.values[2].toDouble()))
          putDouble("timestamp", rotationRateEvent!!.timestamp / 1_000_000_000.0)
        }
      )
    }
    if (rotationEvent != null) {
      SensorManager.getRotationMatrixFromVector(rotationMatrix, rotationEvent!!.values)
      SensorManager.getOrientation(rotationMatrix, rotationResult)
      map.putBundle(
        "rotation",
        Bundle().apply {
          putDouble("alpha", (-rotationResult[0]).toDouble())
          putDouble("beta", (-rotationResult[1]).toDouble())
          putDouble("gamma", rotationResult[2].toDouble())
          putDouble("timestamp", rotationEvent!!.timestamp / 1_000_000_000.0)
        }
      )
    }
    map.putDouble("interval", updateInterval.toDouble())
    map.putInt("orientation", getOrientation())
    return map
  }

  private fun getOrientation(): Int {
    val windowManager = appContext.reactContext?.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    val rotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val activity = appContext.currentActivity
      if (activity == null) {
        Log.e(TAG, "[expo-sensors]: The currentActivity is no longer available")
        0
      } else {
        activity.display?.rotation
      }
    } else {
      @Suppress("DEPRECATION")
      windowManager?.defaultDisplay?.rotation
    }
    if (rotation != null) {
      when (rotation) {
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

  companion object {
    val TAG = DeviceMotionModule::class.simpleName
  }
}
