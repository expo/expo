package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

public class NativeViewGestureHandler extends GestureHandler<NativeViewGestureHandler> {

  private boolean mShouldActivateOnStart;
  private boolean mDisallowInterruption;

  public NativeViewGestureHandler() {
    setShouldCancelWhenOutside(true);
  }

  public NativeViewGestureHandler setShouldActivateOnStart(boolean shouldActivateOnStart) {
    mShouldActivateOnStart = shouldActivateOnStart;
    return this;
  }

  /**
   * Set this to {@code true} when wrapping native components that are supposed to be an exclusive
   * target for a touch stream. Like for example switch or slider component which when activated
   * aren't supposed to be cancelled by scrollview or other container that may also handle touches.
   */
  public NativeViewGestureHandler setDisallowInterruption(boolean disallowInterruption) {
    mDisallowInterruption = disallowInterruption;
    return this;
  }

  @Override
  public boolean shouldRequireToWaitForFailure(GestureHandler handler) {
    return super.shouldRequireToWaitForFailure(handler);
  }

  @Override
  public boolean shouldRecognizeSimultaneously(GestureHandler handler) {
    if (handler instanceof NativeViewGestureHandler) {
      // Special case when the peer handler is also an instance of NativeViewGestureHandler:
      // For the `disallowInterruption` to work correctly we need to check the property when
      // accessed as a peer, because simultaneous recognizers can be set on either side of the
      // connection.
      NativeViewGestureHandler nativeWrapper = (NativeViewGestureHandler) handler;
      if (nativeWrapper.getState() == STATE_ACTIVE && nativeWrapper.mDisallowInterruption) {
        // other handler is active and it disallows interruption, we don't want to get into its way
        return false;
      }
    }

    boolean canBeInterrupted = !mDisallowInterruption;
    int state = getState();
    int otherState = handler.getState();

    if (state == STATE_ACTIVE && otherState == STATE_ACTIVE && canBeInterrupted) {
      // if both handlers are active and the current handler can be interruped it we return `false`
      // as it means the other handler has turned active and returning `true` would prevent it from
      // interrupting the current handler
      return false;
    }
    // otherwise we can only return `true` if already in an active state
    return state == STATE_ACTIVE && canBeInterrupted;
  }

  @Override
  public boolean shouldBeCancelledBy(GestureHandler handler) {
    return !mDisallowInterruption;
  }

  @Override
  protected void onHandle(MotionEvent event) {
    View view = getView();
    int state = getState();
    if (event.getActionMasked() == MotionEvent.ACTION_UP) {
      view.onTouchEvent(event);
      if ((state == STATE_UNDETERMINED || state == STATE_BEGAN) && view.isPressed()) {
        activate();
      }
      end();
    } else if (state == STATE_UNDETERMINED || state == STATE_BEGAN) {
      if (mShouldActivateOnStart) {
        tryIntercept(view, event);
        view.onTouchEvent(event);
        activate();
      } else if (tryIntercept(view, event)) {
        view.onTouchEvent(event);
        activate();
      } else if (state != STATE_BEGAN) {
        begin();
      }
    } else if (state == STATE_ACTIVE) {
      view.onTouchEvent(event);
    }
  }

  private static boolean tryIntercept(View view, MotionEvent event) {
    if (view instanceof ViewGroup && ((ViewGroup) view).onInterceptTouchEvent(event)) {
      return true;
    }
    return false;
  }

  @Override
  protected void onCancel() {
    long time = SystemClock.uptimeMillis();
    MotionEvent event = MotionEvent.obtain(time, time, MotionEvent.ACTION_CANCEL, 0, 0, 0);
    event.setAction(MotionEvent.ACTION_CANCEL);
    getView().onTouchEvent(event);
  }
}
