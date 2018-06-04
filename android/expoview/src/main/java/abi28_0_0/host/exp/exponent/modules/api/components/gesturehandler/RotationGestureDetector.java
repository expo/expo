package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.MotionEvent;

public class RotationGestureDetector {

  public interface OnRotationGestureListener {

    boolean onRotation(RotationGestureDetector detector);

    boolean onRotationBegin(RotationGestureDetector detector);

    void onRotationEnd(RotationGestureDetector detector);
  }

  private long mCurrTime;
  private long mPrevTime;
  private double mPrevAngle;
  private double mAngleDiff;
  private float mAnchorX;
  private float mAnchorY;

  private boolean mInProgress;

  private int mPointerIds[] = new int[2];

  private OnRotationGestureListener mListener;

  public RotationGestureDetector(OnRotationGestureListener listener) {
    mListener = listener;
  }

  private void updateCurrent(MotionEvent event) {
    mPrevTime = mCurrTime;
    mCurrTime = event.getEventTime();

    int firstPointerIndex = event.findPointerIndex(mPointerIds[0]);
    int secondPointerIndex = event.findPointerIndex(mPointerIds[1]);

    float firstPtX = event.getX(mPointerIds[firstPointerIndex]);
    float firstPtY = event.getY(mPointerIds[firstPointerIndex]);
    float secondPtX = event.getX(mPointerIds[secondPointerIndex]);
    float secondPtY = event.getY(mPointerIds[secondPointerIndex]);

    float vectorX = secondPtX - firstPtX;
    float vectorY = secondPtY - firstPtY;

    mAnchorX = (firstPtX + secondPtX) * 0.5f;
    mAnchorY = (firstPtY + secondPtY) * 0.5f;

    // Angle diff should be positive when rotating in clockwise direction
    double angle = -Math.atan2(vectorY, vectorX);

    if (Double.isNaN(mPrevAngle)) {
      mAngleDiff = 0.;
    } else {
      mAngleDiff = mPrevAngle - angle;
    }
    mPrevAngle = angle;

    if (mAngleDiff > Math.PI) {
      mAngleDiff -= Math.PI;
    } else if (mAngleDiff < -Math.PI) {
      mAngleDiff += Math.PI;
    }

    if (mAngleDiff > Math.PI / 2.) {
      mAngleDiff -= Math.PI;
    } else if (mAngleDiff < -Math.PI / 2.) {
      mAngleDiff += Math.PI;
    }
  }

  private void finish() {
    if (mInProgress) {
      mInProgress = false;
      if (mListener != null) {
        mListener.onRotationEnd(this);
      }
    }
  }

  public boolean onTouchEvent(MotionEvent event) {
    switch (event.getActionMasked()) {

      case MotionEvent.ACTION_DOWN:
        mInProgress = false;
        mPointerIds[0] = event.getPointerId(event.getActionIndex());
        mPointerIds[1] = MotionEvent.INVALID_POINTER_ID;
        break;

      case MotionEvent.ACTION_POINTER_DOWN:
        if (!mInProgress) {
          mPointerIds[1] = event.getPointerId(event.getActionIndex());
          mInProgress = true;
          mPrevTime = event.getEventTime();
          mPrevAngle = Double.NaN;
          updateCurrent(event);
          if (mListener != null) {
            mListener.onRotationBegin(this);
          }
        }
        break;

      case MotionEvent.ACTION_MOVE:
        if (mInProgress) {
          updateCurrent(event);
          if (mListener != null) {
            mListener.onRotation(this);
          }
        }
        break;

      case MotionEvent.ACTION_POINTER_UP:
        if (mInProgress) {
          int pointerId = event.getPointerId(event.getActionIndex());
          if (pointerId == mPointerIds[0] || pointerId == mPointerIds[1]) {
            // One of the key pointer has been lifted up, we have to end the gesture
            finish();
          }
        }
        break;

      case MotionEvent.ACTION_UP:
        finish();
        break;
    }
    return true;
  }

  /**
   * Returns rotation in radians since the previous rotation event.
   *
   * @return current rotation step in radians.
   */
  public double getRotation() {
    return mAngleDiff;
  }

  /**
   * Return the time difference in milliseconds between the previous
   * accepted rotation event and the current rotation event.
   *
   * @return Time difference since the last rotation event in milliseconds.
   */
  public long getTimeDelta() {
    return mCurrTime - mPrevTime;
  }

  /**
   * Returns X coordinate of the rotation anchor point relative to the view that the provided motion
   * event coordinates (usually relative to the view event was sent to).
   *
   * @return X coordinate of the rotation anchor point
   */
  public float getAnchorX() {
    return mAnchorX;
  }

  /**
   * Returns Y coordinate of the rotation anchor point relative to the view that the provided motion
   * event coordinates (usually relative to the view event was sent to).
   *
   * @return Y coordinate of the rotation anchor point
   */
  public float getAnchorY() {
    return mAnchorY;
  }
}
