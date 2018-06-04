package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.content.Context;
import android.view.MotionEvent;

import abi28_0_0.com.facebook.infer.annotation.Assertions;
import abi28_0_0.com.facebook.react.bridge.ReactContext;
import abi28_0_0.com.facebook.react.views.view.ReactViewGroup;

import javax.annotation.Nullable;

public class RNGestureHandlerRootView extends ReactViewGroup {

  private @Nullable RNGestureHandlerRootHelper mRootHelper;

  public RNGestureHandlerRootView(Context context) {
    super(context);
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mRootHelper == null) {
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
    if (Assertions.assertNotNull(mRootHelper).dispatchTouchEvent(ev)) {
      return true;
    }
    return super.dispatchTouchEvent(ev);
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    Assertions.assertNotNull(mRootHelper).requestDisallowInterceptTouchEvent(disallowIntercept);
    super.requestDisallowInterceptTouchEvent(disallowIntercept);
  }
}
