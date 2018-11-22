package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.view.ViewParent;

import abi29_0_0.com.facebook.react.ReactRootView;
import abi29_0_0.com.facebook.react.bridge.ReactContext;
import abi29_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi29_0_0.com.facebook.react.common.ReactConstants;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandlerOrchestrator;

public class RNGestureHandlerRootHelper {

  private static final float MIN_ALPHA_FOR_TOUCH = 0.1f;

  private final ReactContext mContext;
  private final GestureHandlerOrchestrator mOrchestrator;
  private final GestureHandler mJSGestureHandler;
  private final ReactRootView mReactRootView;

  private boolean mShouldIntercept = false;
  private boolean mPassingTouch = false;

  private static ReactRootView findRootViewTag(ViewGroup viewGroup) {
    UiThreadUtil.assertOnUiThread();
    ViewParent parent = viewGroup;
    while (parent != null && !(parent instanceof ReactRootView)) {
      parent = parent.getParent();
    }
    if (parent == null) {
      throw new IllegalStateException("View " + viewGroup + " has not been mounted under" +
              " ReactRootView");
    }
    return (ReactRootView) parent;
  }

  public RNGestureHandlerRootHelper(ReactContext context, ViewGroup wrappedView) {
    UiThreadUtil.assertOnUiThread();
    int wrappedViewTag = wrappedView.getId();
    if (wrappedViewTag < 1) {
      throw new IllegalStateException("Expect view tag to be set for " + wrappedView);
    }

    RNGestureHandlerModule module = context.getNativeModule(RNGestureHandlerModule.class);
    RNGestureHandlerRegistry registry = module.getRegistry();

    mReactRootView = findRootViewTag(wrappedView);

    Log.i(
            ReactConstants.TAG,
            "[GESTURE HANDLER] Initialize gesture handler for root view " + mReactRootView);

    mContext = context;
    mOrchestrator = new GestureHandlerOrchestrator(
            wrappedView, registry, new RNViewConfigurationHelper());
    mOrchestrator.setMinimumAlphaForTraversal(MIN_ALPHA_FOR_TOUCH);

    mJSGestureHandler = new RootViewGestureHandler();
    mJSGestureHandler.setTag(-wrappedViewTag);
    registry.registerHandler(mJSGestureHandler);
    registry.attachHandlerToView(mJSGestureHandler.getTag(), wrappedViewTag);

    module.registerRootHelper(this);
  }

  public void tearDown() {
    Log.i(
            ReactConstants.TAG,
            "[GESTURE HANDLER] Tearing down gesture handler registered for root view " + mReactRootView);
    RNGestureHandlerModule module = mContext.getNativeModule(RNGestureHandlerModule.class);
    module.getRegistry().dropHandler(mJSGestureHandler.getTag());
    module.unregisterRootHelper(this);
  }

  public ReactRootView getRootView() {
    return mReactRootView;
  }

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
      mReactRootView.onChildStartedNativeGesture(event);
    }
  }

  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    // If this method gets called it means that some native view is attempting to grab lock for
    // touch event delivery. In that case we cancel all gesture recognizers
    if (mOrchestrator != null && !mPassingTouch) {
      // if we are in the process of delivering touch events via GH orchestrator, we don't want to
      // treat it as a native gesture capturing the lock
      tryCancelAllHandlers();
    }
  }

  public boolean dispatchTouchEvent(MotionEvent ev) {
    // We mark `mPassingTouch` before we get into `mOrchestrator.onTouchEvent` so that we can tell
    // if `requestDisallow` has been called as a result of a normal gesture handling process or
    // as a result of one of the gesture handlers activating
    mPassingTouch = true;
    mOrchestrator.onTouchEvent(ev);
    mPassingTouch = false;

    if (mShouldIntercept) {
      return true;
    } else {
      return false;
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
