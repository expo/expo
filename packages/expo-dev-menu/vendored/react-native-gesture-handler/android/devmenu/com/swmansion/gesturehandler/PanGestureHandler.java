package devmenu.com.swmansion.gesturehandler;

import android.content.Context;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.ViewConfiguration;

public class PanGestureHandler extends GestureHandler<PanGestureHandler> {

  private static float MIN_VALUE_IGNORE = Float.MAX_VALUE;
  private static float MAX_VALUE_IGNORE = Float.MIN_VALUE;

  private static int DEFAULT_MIN_POINTERS = 1;
  private static int DEFAULT_MAX_POINTERS = 10;

  private float mMinDistSq = MAX_VALUE_IGNORE;

  private float mActiveOffsetXStart = MIN_VALUE_IGNORE;
  private float mActiveOffsetXEnd = MAX_VALUE_IGNORE;

  private float mFailOffsetXStart = MAX_VALUE_IGNORE;
  private float mFailOffsetXEnd = MIN_VALUE_IGNORE;

  private float mActiveOffsetYStart = MIN_VALUE_IGNORE;
  private float mActiveOffsetYEnd = MAX_VALUE_IGNORE;

  private float mFailOffsetYStart = MAX_VALUE_IGNORE;
  private float mFailOffsetYEnd = MIN_VALUE_IGNORE;

  private float mMinVelocityX = MIN_VALUE_IGNORE;
  private float mMinVelocityY = MIN_VALUE_IGNORE;
  private float mMinVelocitySq = MIN_VALUE_IGNORE;
  private int mMinPointers = DEFAULT_MIN_POINTERS;
  private int mMaxPointers = DEFAULT_MAX_POINTERS;

  private float mStartX, mStartY;
  private float mOffsetX, mOffsetY;
  private float mLastX, mLastY;
  private float mLastVelocityX, mLastVelocityY;
  private VelocityTracker mVelocityTracker;

  private boolean mAverageTouches;

  /**
   * On Android when there are multiple pointers on the screen pan gestures most often just consider
   * the last placed pointer. The behaviour on iOS is quite different where the x and y component
   * of the pan pointer is calculated as an average out of all the pointers placed on the screen.
   *
   * This behaviour can be customized on android by setting averageTouches property of the handler
   * object. This could be useful in particular for the usecases when we attach other handlers that
   * recognizes multi-finger gestures such as rotation. In that case when we only rely on the last
   * placed finger it is easier for the gesture handler to trigger when we do a rotation gesture
   * because each finger when treated separately will travel some distance, whereas the average
   * position of all the fingers will remain still while doing a rotation gesture.
   */
  public PanGestureHandler(Context context) {
    ViewConfiguration vc = ViewConfiguration.get(context);
    int touchSlop = vc.getScaledTouchSlop();
    mMinDistSq = touchSlop * touchSlop;
  }

  public PanGestureHandler setActiveOffsetXStart(float activeOffsetXStart) {
    mActiveOffsetXStart = activeOffsetXStart;
    return this;
  }

  public PanGestureHandler setActiveOffsetXEnd(float activeOffsetXEnd) {
    mActiveOffsetXEnd = activeOffsetXEnd;
    return this;
  }

  public PanGestureHandler setFailOffsetXStart(float failOffsetXStart) {
    mFailOffsetXStart = failOffsetXStart;
    return this;
  }

  public PanGestureHandler setFailOffsetXEnd(float failOffsetXEnd) {
    mFailOffsetXEnd = failOffsetXEnd;
    return this;
  }

  public PanGestureHandler setActiveOffsetYStart(float activeOffsetYStart) {
    mActiveOffsetYStart = activeOffsetYStart;
    return this;
  }

  public PanGestureHandler setActiveOffsetYEnd(float activeOffsetYEnd) {
    mActiveOffsetYEnd = activeOffsetYEnd;
    return this;
  }

  public PanGestureHandler setFailOffsetYStart(float failOffsetYStart) {
    mFailOffsetYStart = failOffsetYStart;
    return this;
  }

  public PanGestureHandler setFailOffsetYEnd(float failOffsetYEnd) {
    mFailOffsetYEnd = failOffsetYEnd;
    return this;
  }

  public PanGestureHandler setMinDist(float minDist) {
    mMinDistSq = minDist * minDist;
    return this;
  }

  public PanGestureHandler setMinPointers(int minPointers) {
    mMinPointers = minPointers;
    return this;
  }

  public PanGestureHandler setMaxPointers(int maxPointers) {
    mMaxPointers = maxPointers;
    return this;
  }

  public PanGestureHandler setAverageTouches(boolean averageTouches) {
    mAverageTouches = averageTouches;
    return this;
  }

  /**
   * @param minVelocity in pixels per second
   */
  public PanGestureHandler setMinVelocity(float minVelocity) {
    mMinVelocitySq = minVelocity * minVelocity;
    return this;
  }

  public PanGestureHandler setMinVelocityX(float minVelocityX) {
    mMinVelocityX = minVelocityX;
    return this;
  }

  public PanGestureHandler setMinVelocityY(float minVelocityY) {
    mMinVelocityY = minVelocityY;
    return this;
  }

  private boolean shouldActivate() {
    float dx = mLastX - mStartX + mOffsetX;
    if (mActiveOffsetXStart != MIN_VALUE_IGNORE && dx < mActiveOffsetXStart) {
      return true;
    }

    if (mActiveOffsetXEnd != MAX_VALUE_IGNORE && dx > mActiveOffsetXEnd) {
      return true;
    }

    float dy = mLastY - mStartY + mOffsetY;
    if (mActiveOffsetYStart != MIN_VALUE_IGNORE && dy < mActiveOffsetYStart) {
      return true;
    }

    if (mActiveOffsetYEnd != MAX_VALUE_IGNORE && dy > mActiveOffsetYEnd) {
      return true;
    }

    float distSq = dx * dx + dy * dy;
    if (mMinDistSq != MIN_VALUE_IGNORE && distSq >= mMinDistSq) {
      return true;
    }

    float vx = mLastVelocityX;
    if (mMinVelocityX != MIN_VALUE_IGNORE &&
            ((mMinVelocityX < 0 && vx <= mMinVelocityX) || (mMinVelocityX >= 0 && vx >= mMinVelocityX))) {
      return true;
    }

    float vy = mLastVelocityY;
    if (mMinVelocityY != MIN_VALUE_IGNORE &&
            ((mMinVelocityY < 0 && vx <= mMinVelocityY) || (mMinVelocityY >= 0 && vx >= mMinVelocityY))) {
      return true;
    }

    float velocitySq = vx * vx + vy * vy;
    if (mMinVelocitySq != MIN_VALUE_IGNORE && velocitySq >= mMinVelocitySq) {
      return true;
    }

    return false;
  }

  private boolean shouldFail() {
    float dx = mLastX - mStartX + mOffsetX;

    if (mFailOffsetXStart != MAX_VALUE_IGNORE && dx < mFailOffsetXStart) {
      return true;
    }

    if (mFailOffsetXEnd != MIN_VALUE_IGNORE && dx > mFailOffsetXEnd) {
      return true;
    }


    float dy = mLastY - mStartY + mOffsetY;
    if (mFailOffsetYStart != MAX_VALUE_IGNORE && dy < mFailOffsetYStart) {
      return true;
    }

    if (mFailOffsetYEnd != MIN_VALUE_IGNORE && dy > mFailOffsetYEnd) {
      return true;
    }

    return false;
  }

  @Override
  protected void onHandle(MotionEvent event) {
    int state = getState();
    int action = event.getActionMasked();

    if (action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_POINTER_DOWN) {
      // update offset if new pointer gets added or removed
      mOffsetX += mLastX - mStartX;
      mOffsetY += mLastY - mStartY;

      // reset starting point
      mLastX = GestureUtils.getLastPointerX(event, mAverageTouches);
      mLastY = GestureUtils.getLastPointerY(event, mAverageTouches);
      mStartX = mLastX;
      mStartY = mLastY;
    } else {
      mLastX = GestureUtils.getLastPointerX(event, mAverageTouches);
      mLastY = GestureUtils.getLastPointerY(event, mAverageTouches);
    }

    if (state == STATE_UNDETERMINED && event.getPointerCount() >= mMinPointers) {
      mStartX = mLastX;
      mStartY = mLastY;
      mOffsetX = 0;
      mOffsetY = 0;
      mVelocityTracker = VelocityTracker.obtain();
      addVelocityMovement(mVelocityTracker, event);
      begin();
    } else if (mVelocityTracker != null) {
      addVelocityMovement(mVelocityTracker, event);
      mVelocityTracker.computeCurrentVelocity(1000);
      mLastVelocityX = mVelocityTracker.getXVelocity();
      mLastVelocityY = mVelocityTracker.getYVelocity();
    }

    if (action == MotionEvent.ACTION_UP) {
      if (state == STATE_ACTIVE || state == STATE_BEGAN) {
        end();
      } else {
        fail();
      }
    } else if (action == MotionEvent.ACTION_POINTER_DOWN && event.getPointerCount() > mMaxPointers) {
      // When new finger is placed down (POINTER_DOWN) we check if MAX_POINTERS is not exceeded
      if (state == STATE_ACTIVE) {
        cancel();
      } else {
        fail();
      }
    } else if (action == MotionEvent.ACTION_POINTER_UP && state == STATE_ACTIVE
            && event.getPointerCount() < mMinPointers) {
      // When finger is lifted up (POINTER_UP) and the number of pointers falls below MIN_POINTERS
      // threshold, we only want to take an action when the handler has already activated. Otherwise
      // we can still expect more fingers to be placed on screen and fulfill MIN_POINTERS criteria.
      fail();
    } else if (state == STATE_BEGAN) {
      if (shouldFail()) {
        fail();
      } else if (shouldActivate()) {
        // reset starting point
        mStartX = mLastX;
        mStartY = mLastY;
        activate();
      }
    }
  }

  @Override
  protected void onReset() {
    if (mVelocityTracker != null) {
      mVelocityTracker.recycle();
      mVelocityTracker = null;
    }
  }

  public float getTranslationX() {
    return mLastX - mStartX + mOffsetX;
  }

  public float getTranslationY() {
    return mLastY - mStartY + mOffsetY;
  }

  public float getVelocityX() {
    return mLastVelocityX;
  }

  public float getVelocityY() {
    return mLastVelocityY;
  }


  /**
   * This method adds movement to {@class VelocityTracker} first resetting offset of the event so
   * that the velocity is calculated based on the absolute position of touch pointers. This is
   * because if the underlying view moves along with the finger using relative x/y coords yields
   * incorrect results.
   */
  private static void addVelocityMovement(VelocityTracker tracker, MotionEvent event) {
    float offsetX = event.getRawX() - event.getX();
    float offsetY = event.getRawY() - event.getY();
    event.offsetLocation(offsetX, offsetY);
    tracker.addMovement(event);
    event.offsetLocation(-offsetX, -offsetY);
  }
}
