package versioned.host.exp.exponent.modules.api.components.gesturehandler;

import android.os.Handler;
import android.view.MotionEvent;

public class TapGestureHandler extends GestureHandler<TapGestureHandler> {

  private static final long DEFAULT_MAX_DURATION_MS = 500;
  private static final long DEFAULT_MAX_DELAY_MS = 500;
  private static final int DEFAULT_NUMBER_OF_TAPS= 1;

  private long mMaxDurationMs = DEFAULT_MAX_DURATION_MS;
  private long mMaxDelayMs = DEFAULT_MAX_DELAY_MS;
  private int mNumberOfTaps = DEFAULT_NUMBER_OF_TAPS;

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
    if (++mTapsSoFar == mNumberOfTaps) {
      activate();
      end();
    } else {
      mHandler.postDelayed(mFailDelayed, mMaxDelayMs);
    }
  }

  @Override
  protected void onHandle(MotionEvent event) {
    int state = getState();

    mLastEventOffsetX = event.getRawX() - event.getX();
    mLastEventOffsetY = event.getRawY() - event.getY();
    mLastX = event.getRawX();
    mLastY = event.getRawY();

    if (state == STATE_UNDETERMINED) {
      begin();
      mTapsSoFar = 0;
      startTap();
    }
    if (state == STATE_BEGAN) {
      int action = event.getActionMasked();
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
