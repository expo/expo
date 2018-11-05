package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.util.Log;
import android.view.MotionEvent;
import android.view.View;

import java.util.Arrays;

public class GestureHandler<T extends GestureHandler> {

  public static final int STATE_UNDETERMINED = 0;
  public static final int STATE_FAILED = 1;
  public static final int STATE_BEGAN = 2;
  public static final int STATE_CANCELLED = 3;
  public static final int STATE_ACTIVE = 4;
  public static final int STATE_END = 5;

  public static final float HIT_SLOP_NONE = Float.NaN;

  private static final int HIT_SLOP_LEFT_IDX = 0;
  private static final int HIT_SLOP_TOP_IDX = 1;
  private static final int HIT_SLOP_RIGHT_IDX = 2;
  private static final int HIT_SLOP_BOTTOM_IDX = 3;
  private static final int HIT_SLOP_WIDTH_IDX = 4;
  private static final int HIT_SLOP_HEIGHT_IDX = 5;

  public static final int DIRECTION_RIGHT = 1;
  public static final int DIRECTION_LEFT = 2;
  public static final int DIRECTION_UP = 4;
  public static final int DIRECTION_DOWN = 8;

  private static int MAX_POINTERS_COUNT = 11;
  private static MotionEvent.PointerProperties[] sPointerProps;
  private static MotionEvent.PointerCoords[] sPointerCoords;

  private static void initPointerProps(int size) {
    if (sPointerProps == null) {
      sPointerProps = new MotionEvent.PointerProperties[MAX_POINTERS_COUNT];
      sPointerCoords = new MotionEvent.PointerCoords[MAX_POINTERS_COUNT];
    }
    for (; size > 0 && sPointerProps[size - 1] == null; size--) {
      sPointerProps[size - 1] = new MotionEvent.PointerProperties();
      sPointerCoords[size - 1] = new MotionEvent.PointerCoords();
    }
  }

  private final int[] mTrackedPointerIDs = new int[MAX_POINTERS_COUNT];
  private int mTrackedPointersCount = 0;

  private int mTag;
  private View mView;
  private int mState = STATE_UNDETERMINED;
  private float mX, mY;
  private boolean mWithinBounds;
  private boolean mEnabled = true;
  private float mHitSlop[];

  private boolean mShouldCancelWhenOutside;
  private int mNumberOfPointers = 0;

  private GestureHandlerOrchestrator mOrchestrator;
  private OnTouchEventListener<T> mListener;
  private GestureHandlerInteractionController mInteractionController;
  /*package*/ int mActivationIndex; // set and accessed only by the orchestrator
  /*package*/ boolean mIsActive; // set and accessed only by the orchestrator
  /*package*/ boolean mIsAwaiting; // set and accessed only by the orchestrator

  private static boolean hitSlopSet(float value) {
    return !Float.isNaN(value);
  }

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

  public boolean hasCommonPointers(GestureHandler other) {
    for (int i = 0; i < mTrackedPointerIDs.length; i++) {
      if (mTrackedPointerIDs[i] != -1 && other.mTrackedPointerIDs[i] != -1) {
        return true;
      }
    }
    return false;
  }

  public T setShouldCancelWhenOutside(boolean shouldCancelWhenOutside) {
    mShouldCancelWhenOutside = shouldCancelWhenOutside;
    return (T) this;
  }

  public T setEnabled(boolean enabled) {
    if (mView != null) {
      // If view is set then handler is in "active" state. In that case we want to "cancel" handler
      // when it changes enabled state so that it gets cleared from the orchestrator
      cancel();
    }
    mEnabled = enabled;
    return (T) this;
  }

  public boolean isEnabled() {
    return mEnabled;
  }

  public T setHitSlop(float leftPad, float topPad, float rightPad, float bottomPad, float width, float height) {
    if (mHitSlop == null) {
      mHitSlop = new float[6];
    }
    mHitSlop[HIT_SLOP_LEFT_IDX] = leftPad;
    mHitSlop[HIT_SLOP_TOP_IDX] = topPad;
    mHitSlop[HIT_SLOP_RIGHT_IDX] = rightPad;
    mHitSlop[HIT_SLOP_BOTTOM_IDX] = bottomPad;
    mHitSlop[HIT_SLOP_WIDTH_IDX] = width;
    mHitSlop[HIT_SLOP_HEIGHT_IDX] = height;
    if (hitSlopSet(width) && hitSlopSet(leftPad) && hitSlopSet(rightPad)) {
      throw new IllegalArgumentException("Cannot have all of left, right and width defined");
    }
    if (hitSlopSet(width) && !hitSlopSet(leftPad) && !hitSlopSet(rightPad)) {
      throw new IllegalArgumentException("When width is set one of left or right pads need to be defined");
    }
    if (hitSlopSet(height) && hitSlopSet(bottomPad) && hitSlopSet(topPad)) {
      throw new IllegalArgumentException("Cannot have all of top, bottom and height defined");
    }
    if (hitSlopSet(height) && !hitSlopSet(bottomPad) && !hitSlopSet(topPad)) {
      throw new IllegalArgumentException("When height is set one of top or bottom pads need to be defined");
    }
    return (T) this;
  }

  public T setHitSlop(float padding) {
    return setHitSlop(padding, padding, padding, padding, HIT_SLOP_NONE, HIT_SLOP_NONE);
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

  public int getNumberOfPointers() {
    return mNumberOfPointers;
  }

  public boolean isWithinBounds() {
    return mWithinBounds;
  }

  public final void prepare(View view, GestureHandlerOrchestrator orchestrator) {
    if (mView != null || mOrchestrator != null) {
      throw new IllegalStateException("Already prepared or hasn't been reset");
    }
    Arrays.fill(mTrackedPointerIDs, -1);
    mTrackedPointersCount = 0;
    mState = STATE_UNDETERMINED;

    mView = view;
    mOrchestrator = orchestrator;
  }

  private int findNextLocalPointerId() {
    int localPointerId = 0;
    for (; localPointerId < mTrackedPointersCount; localPointerId++) {
      int i = 0;
      for (; i < mTrackedPointerIDs.length; i++) {
        if (mTrackedPointerIDs[i] == localPointerId) {
          break;
        }
      }
      if (i == mTrackedPointerIDs.length) {
        return localPointerId;
      }
    }
    return localPointerId;
  }

  public void startTrackingPointer(int pointerId) {
    if (mTrackedPointerIDs[pointerId] == -1) {
      mTrackedPointerIDs[pointerId] = findNextLocalPointerId();
      mTrackedPointersCount++;
    }
  }

  public void stopTrackingPointer(int pointerId) {
    if (mTrackedPointerIDs[pointerId] != -1) {
      mTrackedPointerIDs[pointerId] = -1;
      mTrackedPointersCount--;
    }
  }

  private boolean needAdapt(MotionEvent event) {
    if (event.getPointerCount() != mTrackedPointersCount) {
      return true;
    }
    for (int i = 0; i < mTrackedPointerIDs.length; i++) {
      if (mTrackedPointerIDs[i] != -1 && mTrackedPointerIDs[i] != i) {
        return true;
      }
    }
    return false;
  }

  private MotionEvent adaptEvent(MotionEvent event) {
    if (!needAdapt(event)) {
      return event;
    }
    int action = event.getActionMasked();
    int actionIndex = -1;
    if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) {
      actionIndex = event.getActionIndex();
      int actionPointer = event.getPointerId(actionIndex);
      if (mTrackedPointerIDs[actionPointer] != -1) {
        action = mTrackedPointersCount == 1 ? MotionEvent.ACTION_DOWN : MotionEvent.ACTION_POINTER_DOWN;
      } else {
        action = MotionEvent.ACTION_MOVE;
      }
    } else if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP) {
      actionIndex = event.getActionIndex();
      int actionPointer = event.getPointerId(actionIndex);
      if (mTrackedPointerIDs[actionPointer] != -1) {
        action = mTrackedPointersCount == 1 ? MotionEvent.ACTION_UP : MotionEvent.ACTION_POINTER_UP;
      } else {
        action = MotionEvent.ACTION_MOVE;
      }
    }
    initPointerProps(mTrackedPointersCount);
    int count = 0;
    float oldX = event.getX();
    float oldY = event.getY();
    event.setLocation(event.getRawX(), event.getRawY());
    for (int index = 0, size = event.getPointerCount(); index < size; index++) {
      int origPointerId = event.getPointerId(index);
      if (mTrackedPointerIDs[origPointerId] != -1) {
        event.getPointerProperties(index, sPointerProps[count]);
        sPointerProps[count].id = mTrackedPointerIDs[origPointerId];
        event.getPointerCoords(index, sPointerCoords[count]);
        if (index == actionIndex) {
          action = action | (count << MotionEvent.ACTION_POINTER_INDEX_SHIFT);
        }
        count++;
      }
    }
    MotionEvent result = MotionEvent.obtain(
            event.getDownTime(),
            event.getEventTime(),
            action,
            count,
            sPointerProps, /* props are copied and hence it is safe to use static array here */
            sPointerCoords, /* same applies to coords */
            event.getMetaState(),
            event.getButtonState(),
            event.getXPrecision(),
            event.getYPrecision(),
            event.getDeviceId(),
            event.getEdgeFlags(),
            event.getSource(),
            event.getFlags());
    event.setLocation(oldX, oldY);
    result.setLocation(oldX, oldY);
    return result;
  }

  public final void handle(MotionEvent origEvent) {
    if (!mEnabled || mState == STATE_CANCELLED || mState == STATE_FAILED
            || mState == STATE_END || mTrackedPointersCount < 1) {
      return;
    }
    MotionEvent event = adaptEvent(origEvent);
    mX = event.getX();
    mY = event.getY();
    mNumberOfPointers = event.getPointerCount();

    mWithinBounds = isWithinBounds(mView, mX, mY);
    if (mShouldCancelWhenOutside && !mWithinBounds) {
      if (mState == STATE_ACTIVE) {
        cancel();
      } else if (mState == STATE_BEGAN) {
        fail();
      }
      return;
    }
    onHandle(event);
    if (event != origEvent) {
      event.recycle();
    }
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
    return mEnabled && mState != STATE_FAILED && mState != STATE_CANCELLED
            && mState != STATE_END && mTrackedPointersCount > 0;
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
      float padLeft = mHitSlop[HIT_SLOP_LEFT_IDX];
      float padTop = mHitSlop[HIT_SLOP_TOP_IDX];
      float padRight = mHitSlop[HIT_SLOP_RIGHT_IDX];
      float padBottom = mHitSlop[HIT_SLOP_BOTTOM_IDX];
      if (hitSlopSet(padLeft)) {
        left -= padLeft;
      }
      if (hitSlopSet(padTop)) {
        top -= padBottom;
      }
      if (hitSlopSet(padRight)) {
        right += padRight;
      }
      if (hitSlopSet(padBottom)) {
        bottom += padBottom;
      }

      float width = mHitSlop[HIT_SLOP_WIDTH_IDX];
      float height= mHitSlop[HIT_SLOP_HEIGHT_IDX];
      if (hitSlopSet(width)) {
        if (!hitSlopSet(padLeft)) {
          left = padRight - width;
        } else if (!hitSlopSet(padRight)) {
          right = padLeft + width;
        }
      }
      if (hitSlopSet(height)) {
        if (!hitSlopSet(top)) {
          top = bottom - height;
        } else if (!hitSlopSet(bottom)) {
          bottom = top + height;
        }
      }
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
    Arrays.fill(mTrackedPointerIDs, -1);
    mTrackedPointersCount = 0;
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
