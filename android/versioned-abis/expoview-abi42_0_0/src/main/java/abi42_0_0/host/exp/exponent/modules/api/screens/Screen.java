package abi42_0_0.host.exp.exponent.modules.api.screens;

import android.content.Context;
import android.content.pm.ActivityInfo;
import android.graphics.Paint;
import android.os.Build;
import android.os.Parcelable;
import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

import abi42_0_0.com.facebook.react.bridge.GuardedRunnable;
import abi42_0_0.com.facebook.react.bridge.ReactContext;
import abi42_0_0.com.facebook.react.uimanager.UIManagerModule;

public class Screen extends ViewGroup {

  public enum StackPresentation {
    PUSH,
    MODAL,
    TRANSPARENT_MODAL
  }

  public enum StackAnimation {
    DEFAULT,
    NONE,
    FADE,
    SIMPLE_FROM_BOTTOM,
    SLIDE_FROM_RIGHT,
    SLIDE_FROM_LEFT
  }

  public enum ReplaceAnimation {
    PUSH,
    POP
  }

  public enum ActivityState {
    INACTIVE,
    TRANSITIONING_OR_BELOW_TOP,
    ON_TOP
  }

  public enum WindowTraits {
    ORIENTATION,
    COLOR,
    STYLE,
    TRANSLUCENT,
    HIDDEN,
    ANIMATED
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
  private ActivityState mActivityState;
  private boolean mTransitioning;
  private StackPresentation mStackPresentation = StackPresentation.PUSH;
  private ReplaceAnimation mReplaceAnimation = ReplaceAnimation.POP;
  private StackAnimation mStackAnimation = StackAnimation.DEFAULT;
  private boolean mGestureEnabled = true;
  private Integer mScreenOrientation;
  private String mStatusBarStyle;
  private Boolean mStatusBarHidden;
  private Boolean mStatusBarTranslucent;
  private Integer mStatusBarColor;
  private Boolean mStatusBarAnimated;

  @Override
  protected void onAnimationStart() {
    super.onAnimationStart();
    if (mFragment != null) {
      mFragment.onViewAnimationStart();
    }
  }

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
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    // This method implements a workaround for RN's autoFocus functionality. Because of the way
    // autoFocus is implemented it sometimes gets triggered before native text view is mounted. As
    // a result Android ignores calls for opening soft keyboard and here we trigger it manually
    // again after the screen is attached.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
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
  }

  protected ScreenStackHeaderConfig getHeaderConfig() {
    View child = getChildAt(0);
    if (child instanceof ScreenStackHeaderConfig) {
      return (ScreenStackHeaderConfig) child;
    }
    return null;
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
    boolean isWebViewInScreen = hasWebView(this);
    if (isWebViewInScreen && getLayerType() != View.LAYER_TYPE_HARDWARE) {
      return;
    }
    super.setLayerType(transitioning && !isWebViewInScreen ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
  }

  private boolean hasWebView(ViewGroup viewGroup) {
    for(int i = 0; i < viewGroup.getChildCount(); i++) {
      View child = viewGroup.getChildAt(i);
      if (child instanceof WebView) {
        return true;
      } else if (child instanceof ViewGroup) {
         if (hasWebView((ViewGroup) child)) {
           return true;
         }
      }
    }
    return false;
  }

  public void setStackPresentation(StackPresentation stackPresentation) {
    mStackPresentation = stackPresentation;
  }

  public void setStackAnimation(StackAnimation stackAnimation) {
    mStackAnimation = stackAnimation;
  }

  public void setReplaceAnimation(ReplaceAnimation replaceAnimation) {
    mReplaceAnimation = replaceAnimation;
  }

  public void setGestureEnabled(boolean gestureEnabled) {
    mGestureEnabled = gestureEnabled;
  }

  public StackAnimation getStackAnimation() {
    return mStackAnimation;
  }

  public ReplaceAnimation getReplaceAnimation() {
    return mReplaceAnimation;
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

  public void setActivityState(ActivityState activityState) {
    if (activityState == mActivityState) {
      return;
    }
    mActivityState = activityState;
    if (mContainer != null) {
      mContainer.notifyChildUpdate();
    }
  }

  public ActivityState getActivityState() {
    return mActivityState;
  }

  public boolean isGestureEnabled() {
    return mGestureEnabled;
  }

  public void setScreenOrientation(String screenOrientation) {
    if (screenOrientation == null) {
      mScreenOrientation = null;
      return;
    }

    ScreenWindowTraits.applyDidSetOrientation();

    switch (screenOrientation) {
      case "all":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR;
        break;
      case "portrait":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
        break;
      case "portrait_up":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
        break;
      case "portrait_down":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT;
        break;
      case "landscape":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        break;
      case "landscape_left":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE;
        break;
      case "landscape_right":
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
        break;
      default:
        mScreenOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
        break;
    }

    if (getFragment() != null) {
      ScreenWindowTraits.setOrientation(this, getFragment().tryGetActivity());
    }
  }

  public Integer getScreenOrientation() {
    return mScreenOrientation;
  }

  public void setStatusBarStyle(String statusBarStyle) {
    if (statusBarStyle != null) {
      ScreenWindowTraits.applyDidSetStatusBarAppearance();
    }

    mStatusBarStyle = statusBarStyle;
    if (getFragment() != null) {
      ScreenWindowTraits.setStyle(this, getFragment().tryGetActivity(), getFragment().tryGetContext());
    }
  }

  public String getStatusBarStyle() {
    return mStatusBarStyle;
  }

  public void setStatusBarHidden(Boolean statusBarHidden) {
    if (statusBarHidden != null) {
      ScreenWindowTraits.applyDidSetStatusBarAppearance();
    }

    mStatusBarHidden = statusBarHidden;
    if (getFragment() != null) {
      ScreenWindowTraits.setHidden(this, getFragment().tryGetActivity());
    }
  }

  public Boolean isStatusBarHidden() {
    return mStatusBarHidden;
  }

  public void setStatusBarTranslucent(Boolean statusBarTranslucent) {
    if (statusBarTranslucent != null) {
      ScreenWindowTraits.applyDidSetStatusBarAppearance();
    }

    mStatusBarTranslucent = statusBarTranslucent;
    if (getFragment() != null) {
      ScreenWindowTraits.setTranslucent(this, getFragment().tryGetActivity(), getFragment().tryGetContext());
    }
  }

  public Boolean isStatusBarTranslucent() {
    return mStatusBarTranslucent;
  }

  public void setStatusBarColor(Integer statusBarColor) {
    if (statusBarColor != null) {
      ScreenWindowTraits.applyDidSetStatusBarAppearance();
    }

    mStatusBarColor = statusBarColor;
    if (getFragment() != null) {
      ScreenWindowTraits.setColor(this, getFragment().tryGetActivity(), getFragment().tryGetContext());
    }
  }

  public Integer getStatusBarColor() {
    return mStatusBarColor;
  }

  public Boolean isStatusBarAnimated() {
    return mStatusBarAnimated;
  }

  public void setStatusBarAnimated(Boolean statusBarAnimated) {
    mStatusBarAnimated = statusBarAnimated;
  }
}
