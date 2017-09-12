package versioned.host.exp.exponent.modules.api.components.gesturehandler;

import android.content.Context;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.ViewConfiguration;

public class PinchGestureHandler extends GestureHandler<PinchGestureHandler> {

  private ScaleGestureDetector mScaleGestureDetector;
  private double mLastScaleFactor;
  private double mLastVelocity;

  private float mStartingSpan;
  private float mSpanSlop;

  private ScaleGestureDetector.OnScaleGestureListener mGestureListener =
          new ScaleGestureDetector.OnScaleGestureListener() {

    @Override
    public boolean onScale(ScaleGestureDetector detector) {
      double prevScaleFactor = mLastScaleFactor;
      mLastScaleFactor *= detector.getScaleFactor();
      long delta = detector.getTimeDelta();
      if (delta > 0) {
        mLastVelocity = (mLastScaleFactor - prevScaleFactor) / delta;
      }
      if (Math.abs(mStartingSpan - detector.getCurrentSpan()) >= mSpanSlop
              && getState() == STATE_BEGAN) {
        activate();
      }
      return true;
    }

    @Override
    public boolean onScaleBegin(ScaleGestureDetector detector) {
      mStartingSpan = detector.getCurrentSpan();
      return true;
    }

    @Override
    public void onScaleEnd(ScaleGestureDetector detector) {
      end();
    }
  };

  public PinchGestureHandler() {
    setShouldCancelWhenOutside(false);
  }

  @Override
  protected void onHandle(MotionEvent event) {
    int state = getState();
    if (state == STATE_UNDETERMINED) {
      Context context = getView().getContext();
      mLastVelocity = 0f;
      mLastScaleFactor = 1f;
      mScaleGestureDetector = new ScaleGestureDetector(context, mGestureListener);
      ViewConfiguration configuration = ViewConfiguration.get(context);
      mSpanSlop = configuration.getScaledTouchSlop();

      begin();
    }

    if (mScaleGestureDetector != null) {
      mScaleGestureDetector.onTouchEvent(event);
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
    mScaleGestureDetector = null;
    mLastVelocity = 0f;
    mLastScaleFactor = 1f;
  }

  public double getScale() {
    return mLastScaleFactor;
  }

  public double getVelocity() {
    return mLastVelocity;
  }
}
