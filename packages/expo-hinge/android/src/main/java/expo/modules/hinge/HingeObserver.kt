package expo.modules.hinge

import android.app.Activity
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import androidx.annotation.MainThread
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

internal enum class HingeStatus(val value: String) : Enumerable {
  PARTIALLY_OPEN("partiallyOpen"),
  FULLY_OPEN("fullyOpen"),
  UNKNOWN("unknown")
}

/**
 * The hinge state as sent to JS. The angle is in degrees, where 0 is closed and 180 is flat.
 */
@OptimizedRecord
internal data class HingeState(
  @Field val angle: Double,
  @Field val status: HingeStatus
) : Record

/**
 * Observes the device hinge through the hinge angle sensor and the folding feature of the current
 * activity's window, and caches the latest state, so `getHinge()` can answer synchronously. The
 * sensor reports the current angle when registered, and Jetpack WindowManager reports a folding
 * feature only while the window spans the fold, so the status is unknown otherwise.
 */
internal class HingeObserver(private val sensorManager: SensorManager?) : SensorEventListener {
  companion object {
    val isAvailable: Boolean
      get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
  }

  var onChange: ((HingeState?) -> Unit)? = null

  private val lock = Any()
  private var angle: Float? = null
  private var foldingState: FoldingFeature.State? = null
  private var currentHinge: HingeState? = null
  private var activity: WeakReference<Activity>? = null
  private var windowLayoutJob: Job? = null

  val hinge: HingeState?
    get() = synchronized(lock) { currentHinge }

  @MainThread
  fun attach(activity: Activity, scope: CoroutineScope) {
    if (!isAvailable || (windowLayoutJob?.isActive == true && this.activity?.get() === activity)) {
      return
    }
    pause()
    val sensorManager = sensorManager ?: return
    val sensor = sensorManager.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE) ?: return
    sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
    this.activity = WeakReference(activity)
    windowLayoutJob = scope.launch {
      WindowInfoTracker.getOrCreate(activity).windowLayoutInfo(activity).collect { layoutInfo ->
        updateFoldingState(layoutInfo.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull()?.state)
      }
    }
  }

  /**
   * Stops observing but keeps the cached state, since Android stops delivering sensor events to
   * apps in the background. Attaching again reports the current state.
   */
  fun pause() {
    sensorManager?.unregisterListener(this)
    windowLayoutJob?.cancel()
    windowLayoutJob = null
    activity = null
  }

  fun detach() {
    pause()
    reset()
  }

  override fun onSensorChanged(event: SensorEvent) {
    updateAngle(event.values[0])
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

  internal fun updateAngle(angle: Float?) = update { this.angle = angle }

  internal fun updateFoldingState(state: FoldingFeature.State?) = update { foldingState = state }

  internal fun reset() = update {
    angle = null
    foldingState = null
  }

  private inline fun update(block: () -> Unit) {
    val (changed, hinge) = synchronized(lock) {
      block()
      val hinge = resolveHinge()
      val changed = hinge != currentHinge
      currentHinge = hinge
      changed to hinge
    }
    if (changed) {
      onChange?.invoke(hinge)
    }
  }

  private fun resolveHinge(): HingeState? {
    val angle = angle ?: return null
    val status = when (foldingState) {
      FoldingFeature.State.FLAT -> HingeStatus.FULLY_OPEN
      FoldingFeature.State.HALF_OPENED -> HingeStatus.PARTIALLY_OPEN
      else -> HingeStatus.UNKNOWN
    }
    return HingeState(angle.toDouble(), status)
  }
}
