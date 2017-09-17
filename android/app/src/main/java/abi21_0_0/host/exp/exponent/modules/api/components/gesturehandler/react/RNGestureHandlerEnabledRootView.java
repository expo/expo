package abi21_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.content.Context;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;

import abi21_0_0.com.facebook.react.ReactInstanceManager;
import abi21_0_0.com.facebook.react.ReactRootView;
import abi21_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi21_0_0.com.facebook.react.common.ReactConstants;
import abi21_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;
import abi21_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandlerOrchestrator;

import javax.annotation.Nullable;

public class RNGestureHandlerEnabledRootView extends ReactRootView {

  // Be default we require views to be at least 10% opaque in order to receive touch
  private static final float MIN_ALPHA_FOR_TOUCH = 0.1f;

  private @Nullable GestureHandlerOrchestrator mOrchestrator;
  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable GestureHandler mJSGestureHandler;

  public RNGestureHandlerEnabledRootView(Context context) {
    super(context);
  }

  private boolean mShouldIntercept = false;
  private boolean mPassingTouch = false;

  private class RootViewGestureHandler extends GestureHandler {
    @Override
    protected void onHandle(MotionEvent event) {
      int currentState = getState();
      if (currentState == STATE_UNDETERMINED) {
        begin();
        mShouldIntercept = false;
      }
      if (event.getActionMasked() == MotionEvent.ACTION_UP) {
        end();
      }
    }

    @Override
    protected void onCancel() {
      mShouldIntercept = true;
      long time = SystemClock.uptimeMillis();
      MotionEvent event = MotionEvent.obtain(time, time, MotionEvent.ACTION_CANCEL, 0, 0, 0);
      event.setAction(MotionEvent.ACTION_CANCEL);
      onChildStartedNativeGesture(event);
    }
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    // If this method gets called it means that some native view is attempting to grab lock for
    // touch event delivery. In that case we cancel all gesture recognizers
    if (mOrchestrator != null && !mPassingTouch) {
      // if we are in the process of delivering touch events via GH orchestrator, we don't want to
      // treat it as a native gesture capturing the lock
      tryCancelAllHandlers();
    }
    super.requestDisallowInterceptTouchEvent(disallowIntercept);
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent ev) {
    if (mOrchestrator == null) {
      return super.dispatchTouchEvent(ev);
    }

    // We mark `mPassingTouch` before we get into `mOrchestrator.onTouchEvent` so that we can tell
    // if `requestDisallow` has been called as a result of a normal gesture handling process or
    // as a result of one of the gesture handlers activating
    mPassingTouch = true;
    mOrchestrator.onTouchEvent(ev);
    mPassingTouch = false;

    if (mShouldIntercept) {
      return true;
    } else {
      return super.dispatchTouchEvent(ev);
    }
  }

  private void tryCancelAllHandlers() {
    // In order to cancel handlers we activate handler that is hooked to the root view
    if (mJSGestureHandler != null && mJSGestureHandler.getState() == GestureHandler.STATE_BEGAN) {
      // Try activate main JS handler
      mJSGestureHandler.activate();
      mJSGestureHandler.end();
    }
  }

  /**
   * This method is used to enable root view to start processing touch events through the gesture
   * handler library lgic. Unless this method is called (which happens as a result of instantiating
   * new gesture handler from JS) the root view component will just proxy all touch related methods
   * to superclass. In a "disabled" state all touch related events will fallback to default RN
   * behaviour.
   */
  /*package*/ void initialize(RNGestureHandlerRegistry registry) {
    Log.i(
      ReactConstants.TAG,
      "[GESTURE HANDLER] Initialize gesture handler for root view " + this);
    mOrchestrator = new GestureHandlerOrchestrator(this, registry);
    mOrchestrator.setMinimumAlphaForTraversal(MIN_ALPHA_FOR_TOUCH);
    int rootViewTag = getRootViewTag();
    if (rootViewTag < 1) {
      throw new IllegalStateException("Expect root view tag to be set for " + this);
    }
    mJSGestureHandler = new RootViewGestureHandler();
    mJSGestureHandler.setTag(-rootViewTag);
    registry.registerHandler(mJSGestureHandler);
    registry.attachHandlerToView(mJSGestureHandler.getTag(), rootViewTag);
  }

  public void reset() {
    if (mOrchestrator != null) {
      Log.i(
        ReactConstants.TAG,
        "[GESTURE HANDLER] Tearing down gesture handler registered for view " + this);
    }
    mOrchestrator = null;
    mJSGestureHandler = null;
    mShouldIntercept = mPassingTouch = false;
  }

  @Override
  public void startReactApplication(
          ReactInstanceManager reactInstanceManager,
          String moduleName,
          @Nullable Bundle initialProperties) {
    super.startReactApplication(reactInstanceManager, moduleName, initialProperties);
    mReactInstanceManager = reactInstanceManager;
  }

  @Override
  public void onAttachedToReactInstance() {
    super.onAttachedToReactInstance();
    RNGestureHandlerModule gestureHandlerModule = getGestureHandlerModule();
    if (gestureHandlerModule != null) {
      getGestureHandlerModule().registerRootView(this);
    }
  }

  @Override
  public void unmountReactApplication() {
    RNGestureHandlerModule gestureHandlerModule = getGestureHandlerModule();
    if (gestureHandlerModule != null) {
      getGestureHandlerModule().unregisterRootView(this);
    }
    mReactInstanceManager = null;
    super.unmountReactApplication();
  }

  private @Nullable RNGestureHandlerModule getGestureHandlerModule() {
    if (mReactInstanceManager == null) {
      return null;
    }
    return mReactInstanceManager
            .getCurrentReactContext()
            .getNativeModule(RNGestureHandlerModule.class);
  }

  /*package*/ void handleSetJSResponder(final int viewTag, final boolean blockNativeResponder) {
    if (blockNativeResponder) {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          tryCancelAllHandlers();
        }
      });
    }
  }
}
