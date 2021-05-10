package devmenu.com.swmansion.gesturehandler.react;

import android.util.Log;
import android.content.Context;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.view.ViewParent;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.views.view.ReactViewGroup;

import androidx.annotation.Nullable;

public class RNGestureHandlerRootView extends ReactViewGroup {

  private static boolean hasGestureHandlerEnabledRootView(ViewGroup viewGroup) {
    UiThreadUtil.assertOnUiThread();
    ViewParent parent = viewGroup.getParent();
    while (parent != null) {
      if (parent instanceof RNGestureHandlerEnabledRootView || parent instanceof RNGestureHandlerRootView) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  private boolean mEnabled;
  private @Nullable RNGestureHandlerRootHelper mRootHelper;

  public RNGestureHandlerRootView(Context context) {
    super(context);
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();

    mEnabled = !hasGestureHandlerEnabledRootView(this);

    if (!mEnabled) {
      Log.i(
              ReactConstants.TAG,
              "[GESTURE HANDLER] Gesture handler is already enabled for a parent view");
    }

    if (mEnabled && mRootHelper == null) {
      mRootHelper = new RNGestureHandlerRootHelper((ReactContext) getContext(), this);
    }
  }

  public void tearDown() {
    if (mRootHelper != null) {
      mRootHelper.tearDown();
    }
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent ev) {
    if (mEnabled && Assertions.assertNotNull(mRootHelper).dispatchTouchEvent(ev)) {
      return true;
    }
    return super.dispatchTouchEvent(ev);
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    if (mEnabled) {
      Assertions.assertNotNull(mRootHelper).requestDisallowInterceptTouchEvent(disallowIntercept);
    }
    super.requestDisallowInterceptTouchEvent(disallowIntercept);
  }
}
