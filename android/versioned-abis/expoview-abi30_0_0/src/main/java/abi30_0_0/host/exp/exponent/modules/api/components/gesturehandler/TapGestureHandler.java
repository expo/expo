package abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.os.Handler;
import android.view.MotionEvent;

public class TapGestureHandler extends GestureHandler<TapGestureHandler> {
  private static float MAX_VALUE_IGNORE = Float.MIN_VALUE;
  private static final long DEFAULT_MAX_DURATION_MS = 500;
  private static final long DEFAULT_MAX_DELAY_MS = 500;
  private static final int DEFAULT_NUMBER_OF_TAPS = 1;
  private static final int DEFAULT_MIN_NUMBER_OF_POINTERS = 1;

  private float mMaxDeltaX = MAX_VALUE_IGNORE;
  private float mMaxDeltaY = MAX_VALUE_IGNORE;
  private float mMaxDistSq = MAX_VALUE_IGNORE;

  private long mMaxDurationMs = DEFAULT_MAX_DURATION_MS;
  private long mMaxDelayMs = DEFAULT_MAX_DELAY_MS;
  private int mNumberOfTaps = DEFAULT_NUMBER_OF_TAPS;
  private int mMinNumberOfPointers = DEFAULT_MIN_NUMBER_OF_POINTERS;
  private int mNumberOfPointers = 1;

  private float mStartX, mStartY;
  private float mOffsetX, mOffsetY;
  private float mLastX, mLastY;
  private float mLastEventOffsetX, mLastEventOffsetY;

  private Handler mHandler;
  private int mTapsSoFar;

  private final Runnable mFailDelayed = new Runnable() {
    @Override
    public void run() {
      fail();
    }
  };

  public TapGestureHandler setNumberOfTaps(int numberOfTaps) {
    mNumberOfTaps = numberOfTaps;
    return this;
  }

  public TapGestureHandler setMaxDelayMs(long maxDelayMs) {
    mMaxDelayMs = maxDelayMs;
    return this;
  }

  public TapGestureHandler setMaxDurationMs(long maxDurationMs) {
    mMaxDurationMs = maxDurationMs;
    return this;
  }

  public TapGestureHandler setMaxDx(float deltaX) {
    mMaxDeltaX = deltaX;
    return this;
  }

  public TapGestureHandler setMaxDy(float deltaY) {
    mMaxDeltaY = deltaY;
    return this;
  }
  public TapGestureHandler setMaxDist(float maxDist) {
    mMaxDistSq = maxDist * maxDist;
    return this;
  }

  public TapGestureHandler setMinNumberOfPointers(int minNumberOfPointers) {
    mMinNumberOfPointers = minNumberOfPointers;
    return this;
  }

  public TapGestureHandler() {
    setShouldCancelWhenOutside(true);
  }

  private void startTap() {
    if (mHandler == null) {
      mHandler = new Handler();
    } else {
      mHandler.removeCallbacksAndMessages(null);
    }
    mHandler.postDelayed(mFailDelayed, mMaxDurationMs);
  }

  private void endTap() {
    if (mHandler == null) {
      mHandler = new Handler();
    } else {
      mHandler.removeCallbacksAndMessages(null);
    }
    if (++mTapsSoFar == mNumberOfTaps && mNumberOfPointers >= mMinNumberOfPointers) {
      activate();
      end();
    } else {
      mHandler.postDelayed(mFailDelayed, mMaxDelayMs);
    }
  }

  private boolean shouldFail() {
    float dx = mLastX - mStartX + mOffsetX;
    if (mMaxDeltaX != MAX_VALUE_IGNORE && Math.abs(dx) > mMaxDeltaX) {
      return true;
    }

    float dy = mLastY - mStartY + mOffsetY;
    if (mMaxDeltaY != MAX_VALUE_IGNORE && Math.abs(dy) > mMaxDeltaY) {
      return true;
    }

    float dist = dy * dy + dx * dx;
    return mMaxDistSq != MAX_VALUE_IGNORE && dist > mMaxDistSq;
  }

  @Override
  protected void onHandle(MotionEvent event) {
    int state = getState();
    int action = event.getActionMasked();

    if (state == STATE_UNDETERMINED) {
      mOffsetX = 0;
      mOffsetY = 0;
      mStartX = event.getRawX();
      mStartY = event.getRawY();
    }

    if (action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_POINTER_DOWN) {
      mOffsetX += mLastX - mStartX;
      mOffsetY += mLastY - mStartY;
      mLastX = GestureUtils.getLastPointerX(event, true);
      mLastY = GestureUtils.getLastPointerY(event, true);
      mLastEventOffsetX = event.getRawX() - event.getX();
      mLastEventOffsetY = event.getRawY() - event.getY();
      mStartX = mLastX;
      mStartY = mLastY;
    } else {
      mLastX = GestureUtils.getLastPointerX(event, true);
      mLastY = GestureUtils.getLastPointerY(event, true);
      mLastEventOffsetX = event.getRawX() - event.getX();
      mLastEventOffsetY = event.getRawY() - event.getY();
    }

    if (mNumberOfPointers < event.getPointerCount()) {
      mNumberOfPointers = event.getPointerCount();
    }

    if (shouldFail()) {
      fail();
    } else if (state == STATE_UNDETERMINED) {
      if (action == MotionEvent.ACTION_DOWN) {
        begin();
      }
      startTap();
  } else if (state == STATE_BEGAN) {
      if (action == MotionEvent.ACTION_UP) {
        endTap();
      } else if (action == MotionEvent.ACTION_DOWN) {
        startTap();
      }
    }
  }

  @Override
  protected void onCancel() {
    if (mHandler != null) {
      mHandler.removeCallbacksAndMessages(null);
    }
  }

  @Override
  protected void onReset() {
    mTapsSoFar = 0;
    mNumberOfPointers = 0;
    if (mHandler != null) {
      mHandler.removeCallbacksAndMessages(null);
    }
  }

  public float getLastAbsolutePositionX() {
    return mLastX;
  }

  public float getLastAbsolutePositionY() {
    return mLastY;
  }

  public float getLastRelativePositionX() {
    return mLastX - mLastEventOffsetX;
  }

  public float getLastRelativePositionY() {
    return mLastY - mLastEventOffsetY;
  }
}
