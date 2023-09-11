package com.swmansion.gesturehandler.core

import android.graphics.PointF
import android.view.MotionEvent
import com.swmansion.gesturehandler.core.RotationGestureDetector.OnRotationGestureListener
import kotlin.math.abs

class RotationGestureHandler : GestureHandler<RotationGestureHandler>() {
  private var rotationGestureDetector: RotationGestureDetector? = null
  var rotation = 0.0
    private set
  var velocity = 0.0
    private set
  var anchorX: Float = Float.NaN
    private set
  var anchorY: Float = Float.NaN
    private set

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

  override fun onHandle(event: MotionEvent, sourceEvent: MotionEvent) {
    if (state == STATE_UNDETERMINED) {
      resetProgress()
      rotationGestureDetector = RotationGestureDetector(gestureListener)

      // set the anchor to the position of the first pointer as NaN causes the event not to arrive
      this.anchorX = event.x
      this.anchorY = event.y

      begin()
    }
    rotationGestureDetector?.onTouchEvent(sourceEvent)
    rotationGestureDetector?.let {
      val point = transformPoint(PointF(it.anchorX, it.anchorY))
      anchorX = point.x
      anchorY = point.y
    }
    if (sourceEvent.actionMasked == MotionEvent.ACTION_UP) {
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
      resetProgress()
    }
    super.activate(force)
  }

  override fun onReset() {
    rotationGestureDetector = null
    anchorX = Float.NaN
    anchorY = Float.NaN
    resetProgress()
  }

  override fun resetProgress() {
    velocity = 0.0
    rotation = 0.0
  }

  companion object {
    private const val ROTATION_RECOGNITION_THRESHOLD = Math.PI / 36.0 // 5 deg in radians
  }
}
