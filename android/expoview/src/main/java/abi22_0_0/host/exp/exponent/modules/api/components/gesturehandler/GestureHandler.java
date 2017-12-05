package abi22_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.MotionEvent;
import android.view.View;

public class GestureHandler<T extends GestureHandler> {

  public static final int STATE_UNDETERMINED = 0;
  public static final int STATE_FAILED = 2;
  public static final int STATE_BEGAN = 3;
  public static final int STATE_CANCELLED = 4;
  public static final int STATE_ACTIVE = 5;
  public static final int STATE_END = 6;

  private static final int HIT_SLOP_LEFT_IDX = 0;
  private static final int HIT_SLOP_TOP_IDX = 1;
  private static final int HIT_SLOP_RIGHT_IDX = 2;
  private static final int HIT_SLOP_BOTTOM_IDX = 3;

  private int mTag;
  private View mView;
  private int mState = STATE_UNDETERMINED;
  private float mX, mY;
  private boolean mWithinBounds;
  private boolean mEnabled = true;
  private float mHitSlop[];

  private boolean mShouldCancelWhenOutside;

  private GestureHandlerOrchestrator mOrchestrator;
  private OnTouchEventListener<T> mListener;
  private GestureHandlerInteractionController mInteractionController;
  /*package*/ int mActivationIndex; // set and accessed only by the orchestrator
  /*package*/ boolean mIsActive; // set and accessed only by the orchestrator
  /*package*/ boolean mIsAwaiting; // set and accessed only by the orchestrator

  /*package*/ void dispatchStateChange(int newState, int prevState) {
    if (mListener != null) {
      mListener.onStateChange((T) this, newState, prevState);
    }
  }

  /*package*/ void dispatchTouchEvent(MotionEvent event) {
    if (mListener != null) {
      mListener.onTouchEvent((T) this, event);
    }
  }

  public T setShouldCancelWhenOutside(boolean shouldCancelWhenOutside) {
    mShouldCancelWhenOutside = shouldCancelWhenOutside;
    return (T) this;
  }

  public T setEnabled(boolean enabled) {
    mEnabled = enabled;
    return (T) this;
  }

  public boolean isEnabled() {
    return mEnabled;
  }

  public T setHitSlop(float leftPad, float topPad, float rightPad, float bottomPad) {
    if (mHitSlop == null) {
      mHitSlop = new float[4];
    }
    mHitSlop[HIT_SLOP_LEFT_IDX] = leftPad;
    mHitSlop[HIT_SLOP_TOP_IDX] = topPad;
    mHitSlop[HIT_SLOP_RIGHT_IDX] = rightPad;
    mHitSlop[HIT_SLOP_BOTTOM_IDX] = bottomPad;
    return (T) this;
  }

  public T setHitSlop(float padding) {
    return setHitSlop(padding, padding, padding, padding);
  }

  public T setInteractionController(GestureHandlerInteractionController controller) {
    mInteractionController = controller;
    return (T) this;
  }

  public void setTag(int tag) {
    mTag = tag;
  }

  public int getTag() {
    return mTag;
  }

  public View getView() {
    return mView;
  }

  public float getX() {
    return mX;
  }

  public float getY() {
    return mY;
  }

  public boolean isWithinBounds() {
    return mWithinBounds;
  }

  public final void prepare(View view, GestureHandlerOrchestrator orchestrator) {
    if (mView != null || mOrchestrator != null) {
      throw new IllegalStateException("Already prepared or hasn't been reset");
    }
    mState = STATE_UNDETERMINED;

    mView = view;
    mOrchestrator = orchestrator;
  }

  public final void handle(MotionEvent event) {
    if (!mEnabled || mState == STATE_CANCELLED || mState == STATE_FAILED || mState == STATE_END) {
      return;
    }
    mX = event.getX();
    mY = event.getY();
    mWithinBounds = isWithinBounds(mView, mX, mY);
    if (mState == STATE_ACTIVE) {
      if (mShouldCancelWhenOutside && !mWithinBounds) {
        cancel();
        return;
      }
    }
    onHandle(event);
  }

  private void moveToState(int newState) {
    if (mState == newState) {
      return;
    }
    int oldState = mState;
    mState = newState;

    mOrchestrator.onHandlerStateChange(this, newState, oldState);

    onStateChange(newState, oldState);
  }

  public boolean wantEvents() {
    return mState != STATE_FAILED && mState != STATE_CANCELLED && mState != STATE_END;
  }

  public int getState() {
    return mState;
  }

  public boolean shouldRequireToWaitForFailure(GestureHandler handler) {
    if (handler != this && mInteractionController != null) {
      return mInteractionController.shouldRequireHandlerToWaitForFailure(this, handler);
    }
    return false;
  }

  public boolean shouldWaitForHandlerFailure(GestureHandler handler) {
    if (handler != this && mInteractionController != null) {
      return mInteractionController.shouldWaitForHandlerFailure(this, handler);
    }
    return false;
  }

  public boolean shouldRecognizeSimultaneously(GestureHandler handler) {
    if (handler == this) {
      return true;
    }
    if (mInteractionController != null) {
      return mInteractionController.shouldRecognizeSimultaneously(this, handler);
    }
    return false;
  }

  public boolean shouldBeCancelledBy(GestureHandler handler) {
    if (handler == this) {
      return false;
    }
    if (mInteractionController != null) {
      return mInteractionController.shouldHandlerBeCancelledBy(this, handler);
    }
    return false;
  }

  public boolean isWithinBounds(View view, float posX, float posY) {
    float left = 0;
    float top = 0;
    float right = view.getWidth();
    float bottom = view.getHeight();
    if (mHitSlop != null) {
      left -= mHitSlop[HIT_SLOP_LEFT_IDX];
      top -= mHitSlop[HIT_SLOP_TOP_IDX];
      right += mHitSlop[HIT_SLOP_RIGHT_IDX];
      bottom += mHitSlop[HIT_SLOP_BOTTOM_IDX];
    }
    return posX >= left && posX <= right && posY >= top && posY <= bottom;
  }

  public final void cancel() {
    if (mState == STATE_ACTIVE || mState == STATE_UNDETERMINED || mState == STATE_BEGAN) {
      onCancel();
      moveToState(STATE_CANCELLED);
    }
  }

  public final void fail() {
    if (mState == STATE_ACTIVE || mState == STATE_UNDETERMINED || mState == STATE_BEGAN) {
      moveToState(STATE_FAILED);
    }
  }

  public final void activate() {
    if (mState == STATE_UNDETERMINED || mState == STATE_BEGAN) {
      moveToState(STATE_ACTIVE);
    }
  }

  public final void begin() {
    if (mState == STATE_UNDETERMINED) {
      moveToState(STATE_BEGAN);
    }
  }

  public final void end() {
    if (mState == STATE_BEGAN || mState == STATE_ACTIVE) {
      moveToState(STATE_END);
    }
  }

  protected void onHandle(MotionEvent event) {
    moveToState(STATE_FAILED);
  }

  protected void onStateChange(int newState, int previousState) {
  }

  protected void onReset() {
  }

  protected void onCancel() {
  }

  public final void reset() {
    mView = null;
    mOrchestrator = null;
    onReset();
  }

  public static String stateToString(int state) {
    switch (state) {
      case STATE_UNDETERMINED: return "UNDETERMINED";
      case STATE_ACTIVE: return "ACTIVE";
      case STATE_FAILED: return "FAILED";
      case STATE_BEGAN: return "BEGIN";
      case STATE_CANCELLED: return "CANCELLED";
      case STATE_END: return "END";
    }
    return null;
  }

  public GestureHandler setOnTouchEventListener(OnTouchEventListener<T> listener) {
    mListener = listener;
    return this;
  }

  @Override
  public String toString() {
    String viewString = mView == null ? null : mView.getClass().getSimpleName();
    return this.getClass().getSimpleName() + "@[" + mTag + "]:"  + viewString;
  }
}
