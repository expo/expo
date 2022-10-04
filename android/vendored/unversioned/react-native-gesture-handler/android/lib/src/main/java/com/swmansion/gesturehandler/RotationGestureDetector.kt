package com.swmansion.gesturehandler

import android.view.MotionEvent
import kotlin.math.atan2

class RotationGestureDetector(private val gestureListener: OnRotationGestureListener?) {
  interface OnRotationGestureListener {
    fun onRotation(detector: RotationGestureDetector): Boolean
    fun onRotationBegin(detector: RotationGestureDetector): Boolean
    fun onRotationEnd(detector: RotationGestureDetector)
  }

  private var currentTime = 0L
  private var previousTime = 0L
  private var previousAngle = 0.0

  /**
   * Returns rotation in radians since the previous rotation event.
   *
   * @return current rotation step in radians.
   */
  var rotation = 0.0
    private set

  /**
   * Returns X coordinate of the rotation anchor point relative to the view that the provided motion
   * event coordinates (usually relative to the view event was sent to).
   *
   * @return X coordinate of the rotation anchor point
   */
  var anchorX = 0f
    private set

  /**
   * Returns Y coordinate of the rotation anchor point relative to the view that the provided motion
   * event coordinates (usually relative to the view event was sent to).
   *
   * @return Y coordinate of the rotation anchor point
   */
  var anchorY = 0f
    private set

  /**
   * Return the time difference in milliseconds between the previous
   * accepted rotation event and the current rotation event.
   *
   * @return Time difference since the last rotation event in milliseconds.
   */
  val timeDelta: Long
    get() = currentTime - previousTime

  private var isInProgress = false
  private val pointerIds = IntArray(2)

  private fun updateCurrent(event: MotionEvent) {
    previousTime = currentTime
    currentTime = event.eventTime
    val firstPointerIndex = event.findPointerIndex(pointerIds[0])
    val secondPointerIndex = event.findPointerIndex(pointerIds[1])
    val firstPtX = event.getX(firstPointerIndex)
    val firstPtY = event.getY(firstPointerIndex)
    val secondPtX = event.getX(secondPointerIndex)
    val secondPtY = event.getY(secondPointerIndex)
    val vectorX = secondPtX - firstPtX
    val vectorY = secondPtY - firstPtY
    anchorX = (firstPtX + secondPtX) * 0.5f
    anchorY = (firstPtY + secondPtY) * 0.5f

    // Angle diff should be positive when rotating in clockwise direction
    val angle = -atan2(vectorY.toDouble(), vectorX.toDouble())
    rotation = if (previousAngle.isNaN()) {
      0.0
    } else previousAngle - angle

    previousAngle = angle
    if (rotation > Math.PI) {
      rotation -= Math.PI
    } else if (rotation < -Math.PI) {
      rotation += Math.PI
    }
    if (rotation > Math.PI / 2.0) {
      rotation -= Math.PI
    } else if (rotation < -Math.PI / 2.0) {
      rotation += Math.PI
    }
  }

  private fun finish() {
    if (isInProgress) {
      isInProgress = false
      gestureListener?.onRotationEnd(this)
    }
  }

  fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        isInProgress = false
        pointerIds[0] = event.getPointerId(event.actionIndex)
        pointerIds[1] = MotionEvent.INVALID_POINTER_ID
      }
      MotionEvent.ACTION_POINTER_DOWN -> if (!isInProgress) {
        pointerIds[1] = event.getPointerId(event.actionIndex)
        isInProgress = true
        previousTime = event.eventTime
        previousAngle = Double.NaN
        updateCurrent(event)
        gestureListener?.onRotationBegin(this)
      }
      MotionEvent.ACTION_MOVE -> if (isInProgress) {
        updateCurrent(event)
        gestureListener?.onRotation(this)
      }
      MotionEvent.ACTION_POINTER_UP -> if (isInProgress) {
        val pointerId = event.getPointerId(event.actionIndex)
        if (pointerId == pointerIds[0] || pointerId == pointerIds[1]) {
          // One of the key pointer has been lifted up, we have to end the gesture
          finish()
        }
      }
      MotionEvent.ACTION_UP -> finish()
    }
    return true
  }
}
