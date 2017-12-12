package abi24_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.os.Handler;
import android.os.SystemClock;
import android.view.MotionEvent;

public class LongPressGestureHandler extends GestureHandler<LongPressGestureHandler> {

  private static final long DEFAULT_MIN_DURATION_MS = 1000; // 1 sec

  private long mMinDurationMs = DEFAULT_MIN_DURATION_MS;
  private Handler mHandler;

  public LongPressGestureHandler() {
    setShouldCancelWhenOutside(true);
  }

  public void setMinDurationMs(long minDurationMs) {
    mMinDurationMs = minDurationMs;
  }

  @Override
  protected void onHandle(MotionEvent event) {
    if (getState() == STATE_UNDETERMINED) {
      begin();
      mHandler = new Handler();
      mHandler.postDelayed(new Runnable() {
        @Override
        public void run() {
          activate();
          end();
        }
      }, mMinDurationMs);
    }
    if (event.getActionMasked() == MotionEvent.ACTION_UP) {
      if (mHandler != null) {
        mHandler.removeCallbacksAndMessages(null);
        mHandler = null;
      }
      fail();
    }
  }

  @Override
  protected void onStateChange(int newState, int previousState) {
    if (mHandler != null) {
      mHandler.removeCallbacksAndMessages(null);
      mHandler = null;
    }
  }
}
