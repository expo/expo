package devmenu.com.swmansion.gesturehandler

import android.view.MotionEvent
import devmenu.com.swmansion.gesturehandler.RotationGestureDetector.OnRotationGestureListener
import kotlin.math.abs

class RotationGestureHandler : GestureHandler<RotationGestureHandler>() {
  private var rotationGestureDetector: RotationGestureDetector? = null
  var rotation = 0.0
    private set
  var velocity = 0.0
    private set

  val anchorX: Float
    get() = rotationGestureDetector?.anchorX ?: Float.NaN
  val anchorY: Float
    get() = rotationGestureDetector?.anchorY ?: Float.NaN

  init {
    setShouldCancelWhenOutside(false)
  }

  private val gestureListener: OnRotationGestureListener = object : OnRotationGestureListener {
    override fun onRotation(detector: RotationGestureDetector): Boolean {
      val prevRotation: Double = rotation
      rotation += detector.rotation
      val delta = detector.timeDelta
      if (delta > 0) {
        velocity = (rotation - prevRotation) / delta
      }
      if (abs(rotation) >= ROTATION_RECOGNITION_THRESHOLD && state == STATE_BEGAN) {
        activate()
      }
      return true
    }

    override fun onRotationBegin(detector: RotationGestureDetector) = true

    override fun onRotationEnd(detector: RotationGestureDetector) {
      end()
    }
  }

  override fun onHandle(event: MotionEvent) {
    if (state == STATE_UNDETERMINED) {
      velocity = 0.0
      rotation = 0.0
      rotationGestureDetector = RotationGestureDetector(gestureListener)
      begin()
    }
    rotationGestureDetector?.onTouchEvent(event)
    if (event.actionMasked == MotionEvent.ACTION_UP) {
      if (state == STATE_ACTIVE) {
        end()
      } else {
        fail()
      }
    }
  }

  override fun activate(force: Boolean) {
    // reset rotation if the handler has not yet activated
    if (state != STATE_ACTIVE) {
      rotation = 0.0
      velocity = 0.0
    }
    super.activate(force)
  }

  override fun onReset() {
    rotationGestureDetector = null
    velocity = 0.0
    rotation = 0.0
  }

  companion object {
    private const val ROTATION_RECOGNITION_THRESHOLD = Math.PI / 36.0 // 5 deg in radians
  }
}
