package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.content.Context;
import android.os.Bundle;
import android.view.MotionEvent;

import abi29_0_0.com.facebook.react.ReactInstanceManager;
import abi29_0_0.com.facebook.react.ReactRootView;

import javax.annotation.Nullable;

public class RNGestureHandlerEnabledRootView extends ReactRootView {

  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable RNGestureHandlerRootHelper mGestureRootHelper;

  public RNGestureHandlerEnabledRootView(Context context) {
    super(context);
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    if (mGestureRootHelper != null) {
      mGestureRootHelper.requestDisallowInterceptTouchEvent(disallowIntercept);
    }
    super.requestDisallowInterceptTouchEvent(disallowIntercept);
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent ev) {
    if (mGestureRootHelper != null && mGestureRootHelper.dispatchTouchEvent(ev)) {
      return true;
    }
    return super.dispatchTouchEvent(ev);
  }

  /**
   * This method is used to enable root view to start processing touch events through the gesture
   * handler library logic. Unless this method is called (which happens as a result of instantiating
   * new gesture handler from JS) the root view component will just proxy all touch related methods
   * to its superclass. Thus in the "disabled" state all touch related events will fallback to
   * default RN behavior.
   */
  public void initialize() {
    if (mGestureRootHelper != null) {
      throw new IllegalStateException("GestureHandler already initialized for root view " + this);
    }
    mGestureRootHelper = new RNGestureHandlerRootHelper(
            mReactInstanceManager.getCurrentReactContext(), this);
  }

  public void tearDown() {
    if (mGestureRootHelper != null) {
      mGestureRootHelper.tearDown();
      mGestureRootHelper = null;
    }
  }

  @Override
  public void startReactApplication(
          ReactInstanceManager reactInstanceManager,
          String moduleName,
          @Nullable Bundle initialProperties) {
    super.startReactApplication(reactInstanceManager, moduleName, initialProperties);
    mReactInstanceManager = reactInstanceManager;
  }
}
