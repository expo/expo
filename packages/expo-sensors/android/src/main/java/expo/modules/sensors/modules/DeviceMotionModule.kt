package expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Build
import android.util.Log
import android.view.Surface
import android.view.WindowManager
import com.facebook.react.bridge.LifecycleEventListener
import expo.modules.sensors.DefaultUpdateInterval
import expo.modules.sensors.DeviceMotionEvent
import expo.modules.sensors.PermissionResponse
import expo.modules.sensors.RotationSensorEvent
import expo.modules.sensors.SensorSubscription
import expo.modules.sensors.ThreeAxisSensorEvent
import expo.modules.sensors.askForActivityRecognitionPermissions
import expo.modules.sensors.getActivityRecognitionPermissions
import expo.modules.sensors.toRotationEvent
import expo.modules.sensors.toRotationRateEvent
import expo.modules.sensors.toThreeAxisSensorEvent
import io.github.expo.modules.v2.Constant
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.androidContextOrNull
import io.github.expo.modules.v2.react.currentActivity
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.DurationUnit

private val sensorTypes = arrayListOf(
  Sensor.TYPE_GYROSCOPE,
  Sensor.TYPE_ACCELEROMETER,
  Sensor.TYPE_LINEAR_ACCELERATION,
  Sensor.TYPE_ROTATION_VECTOR,
  Sensor.TYPE_GRAVITY
)

@ExpoModule("ExponentDeviceMotion")
class DeviceMotionModule : Module(), SensorEventListener2, LifecycleEventListener {
  @Volatile
  private var updateInterval: Duration = DefaultUpdateInterval.milliseconds
  private val rotationMatrix = FloatArray(9)
  private val rotationResult = FloatArray(3)

  @Volatile
  private var acceleration: ThreeAxisSensorEvent? = null

  @Volatile
  private var accelerometer: ThreeAxisSensorEvent? = null

  @Volatile
  private var rotation: RotationSensorEvent? = null

  @Volatile
  private var rotationRate: RotationSensorEvent? = null

  @Volatile
  private var gravityVector: ThreeAxisSensorEvent? = null

  private val dataChanged = Channel<Unit>(Channel.CONFLATED)

  private var isObserving = false

  private val dispatchScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  private var dispatchJob: Job? = null

  private val subscriptions: List<SensorSubscription> by lazy {
    sensorTypes.map { type ->
      SensorSubscription(
        androidContext,
        type,
        this,
        updateInterval = 0
      )
    }
  }

  @Event(name = "deviceMotionDidUpdate")
  private val onUpdate = event<DeviceMotionEvent>(
    onStartObserving = { startObservingSensors() },
    onStopObserving = { stopObservingSensors() }
  )

  @JS(name = "Gravity")
  @Constant
  val gravity: Float = SensorManager.GRAVITY_EARTH

  @JS
  fun setUpdateInterval(updateInterval: Float): Promise<Unit> {
    this.updateInterval = updateInterval.toDouble().milliseconds
    return Promise.resolve()
  }

  @JS
  private fun getPermissionsAsync(): Promise<PermissionResponse> =
    getActivityRecognitionPermissions()

  @JS
  private fun requestPermissionsAsync(): Promise<PermissionResponse> =
    askForActivityRecognitionPermissions()

  @JS
  fun isAvailableAsync(): Promise<Boolean> {
    val sensorManager = androidContextOrNull
      ?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
      ?: return Promise.resolve(false)
    val result = sensorTypes.all { sensorManager.getDefaultSensor(it) != null }
    return Promise.resolve(result)
  }

  override fun onDestroy() {
    dispatchScope.cancel()
    reactContextOrNull?.removeLifecycleEventListener(this)
    if (isObserving) {
      subscriptions.forEach { it.stopObserving() }
    }
  }

  private fun startObservingSensors() {
    reactContext.addLifecycleEventListener(this)
    subscriptions.forEach { it.startObserving() }
    startDispatching()
    isObserving = true
  }

  private fun stopObservingSensors() {
    reactContextOrNull?.removeLifecycleEventListener(this)
    if (isObserving) {
      subscriptions.forEach { it.stopObserving() }
    }
    stopDispatching()
    isObserving = false
    acceleration = null
    accelerometer = null
    rotation = null
    rotationRate = null
    gravityVector = null
  }

  override fun onHostResume() {
    if (isObserving) {
      subscriptions.forEach { it.startObserving() }
      startDispatching()
    }
  }

  override fun onHostPause() {
    if (isObserving) {
      subscriptions.forEach { it.stopObserving() }
      stopDispatching()
    }
  }

  override fun onHostDestroy() {
    if (isObserving) {
      subscriptions.forEach { it.stopObserving() }
      stopDispatching()
    }
  }

  @Synchronized
  private fun startDispatching() {
    dispatchJob?.cancel()
    dispatchJob = dispatchScope.launch {
      var lastEvent: DeviceMotionEvent? = null
      for (signal in dataChanged) {
        val event = createEvent()
        // A signal can come after its data was already sent.
        if (event == lastEvent) {
          continue
        }
        onUpdate(event)
        lastEvent = event
        delay(updateInterval)
      }
    }
  }

  @Synchronized
  private fun stopDispatching() {
    dispatchJob?.cancel()
    dispatchJob = null
    dataChanged.tryReceive()
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    when (sensorEvent.sensor.type) {
      Sensor.TYPE_GYROSCOPE -> rotationRate = sensorEvent.toRotationRateEvent()
      Sensor.TYPE_ACCELEROMETER -> accelerometer = sensorEvent.toThreeAxisSensorEvent()
      Sensor.TYPE_LINEAR_ACCELERATION -> acceleration = sensorEvent.toThreeAxisSensorEvent()
      Sensor.TYPE_ROTATION_VECTOR -> rotation = sensorEvent.toRotationEvent(rotationMatrix, rotationResult)
      Sensor.TYPE_GRAVITY -> {
        gravityVector = sensorEvent.toThreeAxisSensorEvent()
        // Gravity only corrects `accelerationIncludingGravity` - the next accelerometer sample sends it.
        return
      }
    }
    dataChanged.trySend(Unit)
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  override fun onFlushCompleted(sensor: Sensor) = Unit

  private fun createEvent(): DeviceMotionEvent {
    val accelerometer = accelerometer
    val gravity = gravityVector
    val accelerationIncludingGravity = if (accelerometer != null && gravity != null) {
      ThreeAxisSensorEvent(
        x = accelerometer.x - 2 * gravity.x,
        y = accelerometer.y - 2 * gravity.y,
        z = accelerometer.z - 2 * gravity.z,
        timestamp = accelerometer.timestamp
      )
    } else {
      null
    }

    return DeviceMotionEvent(
      acceleration = acceleration,
      accelerationIncludingGravity = accelerationIncludingGravity,
      rotation = rotation,
      rotationRate = rotationRate,
      interval = updateInterval.toDouble(DurationUnit.MILLISECONDS),
      orientation = getOrientation()
    )
  }

  private fun getOrientation(): Int {
    val windowManager = androidContextOrNull?.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    val rotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val activity = currentActivity
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
