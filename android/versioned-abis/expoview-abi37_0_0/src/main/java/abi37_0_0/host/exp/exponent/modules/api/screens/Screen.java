package abi37_0_0.host.exp.exponent.modules.api.screens;

import android.content.Context;
import android.graphics.Paint;
import android.os.Parcelable;
import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;

import androidx.annotation.Nullable;

import abi37_0_0.com.facebook.react.bridge.GuardedRunnable;
import abi37_0_0.com.facebook.react.bridge.ReactContext;
import abi37_0_0.com.facebook.react.uimanager.UIManagerModule;

public class Screen extends ViewGroup {

  public enum StackPresentation {
    PUSH,
    MODAL,
    TRANSPARENT_MODAL
  }

  public enum StackAnimation {
    DEFAULT,
    NONE,
    FADE
  }

  private static OnAttachStateChangeListener sShowSoftKeyboardOnAttach = new OnAttachStateChangeListener() {

    @Override
    public void onViewAttachedToWindow(View view) {
      InputMethodManager inputMethodManager =
              (InputMethodManager) view.getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
      inputMethodManager.showSoftInput(view, 0);
      view.removeOnAttachStateChangeListener(sShowSoftKeyboardOnAttach);
    }

    @Override
    public void onViewDetachedFromWindow(View view) {

    }
  };

  private @Nullable ScreenFragment mFragment;
  private @Nullable ScreenContainer mContainer;
  private boolean mActive;
  private boolean mTransitioning;
  private StackPresentation mStackPresentation = StackPresentation.PUSH;
  private StackAnimation mStackAnimation = StackAnimation.DEFAULT;
  private boolean mGestureEnabled = true;

  @Override
  protected void onAnimationEnd() {
    super.onAnimationEnd();
    if (mFragment != null) {
      mFragment.onViewAnimationEnd();
    }
  }

  public Screen(ReactContext context) {
    super(context);
    // we set layout params as WindowManager.LayoutParams to workaround the issue with TextInputs
    // not displaying modal menus (e.g., copy/paste or selection). The missing menus are due to the
    // fact that TextView implementation is expected to be attached to window when layout happens.
    // Then, at the moment of layout it checks whether window type is in a reasonable range to tell
    // whether it should enable selection controlls (see Editor.java#prepareCursorControllers).
    // With screens, however, the text input component can be laid out before it is attached, in that
    // case TextView tries to get window type property from the oldest existing parent, which in this
    // case is a Screen class, as it is the root of the screen that is about to be attached. Setting
    // params this way is not the most elegant way to solve this problem but workarounds it for the
    // time being
    setLayoutParams(new WindowManager.LayoutParams(WindowManager.LayoutParams.TYPE_APPLICATION));
  }

  @Override
  protected void dispatchSaveInstanceState(SparseArray<Parcelable> container) {
    // do nothing, react native will keep the view hierarchy so no need to serialize/deserialize
    // view's states. The side effect of restoring is that TextInput components would trigger set-text
    // events which may confuse text input handling.
  }

  @Override
  protected void dispatchRestoreInstanceState(SparseArray<Parcelable> container) {
    // ignore restoring instance state too as we are not saving anything anyways.
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    if (changed) {
      final int width = r - l;
      final int height = b - t;
      final ReactContext reactContext = (ReactContext) getContext();
      reactContext.runOnNativeModulesQueueThread(
              new GuardedRunnable(reactContext) {
                @Override
                public void runGuarded() {
                  reactContext.getNativeModule(UIManagerModule.class)
                          .updateNodeSize(getId(), width, height);
                }
              });
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    clearDisappearingChildren();
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    // This method implements a workaround for RN's autoFocus functionality. Because of the way
    // autoFocus is implemented it sometimes gets triggered before native text view is mounted. As
    // a result Android ignores calls for opening soft keyboard and here we trigger it manually
    // again after the screen is attached.
    View view = getFocusedChild();
    if (view != null) {
      while (view instanceof ViewGroup) {
        view = ((ViewGroup) view).getFocusedChild();
      }
      if (view instanceof TextView) {
        TextView textView = (TextView) view;
        if (textView.getShowSoftInputOnFocus()) {
          textView.addOnAttachStateChangeListener(sShowSoftKeyboardOnAttach);
        }
      }
    }
  }

  /**
   * While transitioning this property allows to optimize rendering behavior on Android and provide
   * a correct blending options for the animated screen. It is turned on automatically by the container
   * when transitioning is detected and turned off immediately after
   */
  public void setTransitioning(boolean transitioning) {
    if (mTransitioning == transitioning) {
      return;
    }
    mTransitioning = transitioning;
    super.setLayerType(transitioning ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
  }

  public void setStackPresentation(StackPresentation stackPresentation) {
    mStackPresentation = stackPresentation;
  }

  public void setStackAnimation(StackAnimation stackAnimation) {
    mStackAnimation = stackAnimation;
  }

  public void setGestureEnabled(boolean gestureEnabled) {
    mGestureEnabled = gestureEnabled;
  }

  public StackAnimation getStackAnimation() {
    return mStackAnimation;
  }

  public StackPresentation getStackPresentation() {
    return mStackPresentation;
  }

  @Override
  public void setLayerType(int layerType, @Nullable Paint paint) {
    // ignore - layer type is controlled by `transitioning` prop
  }

  protected void setContainer(@Nullable ScreenContainer container) {
    mContainer = container;
  }

  protected void setFragment(ScreenFragment fragment) {
    mFragment = fragment;
  }

  protected @Nullable ScreenFragment getFragment() {
    return mFragment;
  }

  protected @Nullable ScreenContainer getContainer() {
    return mContainer;
  }

  public void setActive(boolean active) {
    if (active == mActive) {
      return;
    }
    mActive = active;
    if (mContainer != null) {
      mContainer.notifyChildUpdate();
    }
  }

  public boolean isActive() {
    return mActive;
  }

  public boolean isGestureEnabled() {
    return mGestureEnabled;
  }
}
