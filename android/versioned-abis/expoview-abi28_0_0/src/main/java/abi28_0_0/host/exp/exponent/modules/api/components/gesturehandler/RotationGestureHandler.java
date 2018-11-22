package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.MotionEvent;

public class RotationGestureHandler extends GestureHandler<RotationGestureHandler> {

  private static final double ROTATION_RECOGNITION_THRESHOLD = Math.PI / 36.; // 5 deg in radians

  private RotationGestureDetector mRotationGestureDetector;
  private double mLastRotation;
  private double mLastVelocity;

  private RotationGestureDetector.OnRotationGestureListener mGestureListener = new RotationGestureDetector.OnRotationGestureListener() {

    @Override
    public boolean onRotation(RotationGestureDetector detector) {
      double prevRotation = mLastRotation;
      mLastRotation += detector.getRotation();
      long delta = detector.getTimeDelta();
      if (delta > 0) {
        mLastVelocity = (mLastRotation - prevRotation) / delta;
      }
      if (Math.abs(mLastRotation) >= ROTATION_RECOGNITION_THRESHOLD && getState() == STATE_BEGAN) {
        activate();
      }
      return true;
    }

    @Override
    public boolean onRotationBegin(RotationGestureDetector detector) {
      return true;
    }

    @Override
    public void onRotationEnd(RotationGestureDetector detector) {
      end();
    }
  };

  public RotationGestureHandler() {
    setShouldCancelWhenOutside(false);
  }

  @Override
  protected void onHandle(MotionEvent event) {
    int state = getState();
    if (state == STATE_UNDETERMINED) {
      mLastVelocity = 0f;
      mLastRotation = 0f;
      mRotationGestureDetector = new RotationGestureDetector(mGestureListener);

      begin();
    }

    if (mRotationGestureDetector != null) {
      mRotationGestureDetector.onTouchEvent(event);
    }

    if (event.getActionMasked() == MotionEvent.ACTION_UP) {
      if (state == STATE_ACTIVE) {
        end();
      } else {
        fail();
      }
    }
  }

  @Override
  protected void onReset() {
    mRotationGestureDetector = null;
    mLastVelocity = 0f;
    mLastRotation = 0f;
  }

  public double getRotation() {
    return mLastRotation;
  }

  public double getVelocity() {
    return mLastVelocity;
  }

  public float getAnchorX() {
    if (mRotationGestureDetector == null) {
      return Float.NaN;
    }
    return mRotationGestureDetector.getAnchorX();
  }

  public float getAnchorY() {
    if (mRotationGestureDetector == null) {
      return Float.NaN;
    }
    return mRotationGestureDetector.getAnchorY();
  }
}
