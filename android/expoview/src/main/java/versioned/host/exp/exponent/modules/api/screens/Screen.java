package versioned.host.exp.exponent.modules.api.screens;

import android.content.Context;
import android.graphics.Paint;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.UIManagerModule;

public class Screen extends ViewGroup implements ReactPointerEventsView {

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

  private @Nullable Fragment mFragment;
  private @Nullable ScreenContainer mContainer;
  private boolean mActive;
  private boolean mTransitioning;
  private StackPresentation mStackPresentation = StackPresentation.PUSH;
  private StackAnimation mStackAnimation = StackAnimation.DEFAULT;

  public Screen(ReactContext context) {
    super(context);
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

  public StackAnimation getStackAnimation() {
    return mStackAnimation;
  }

  public StackPresentation getStackPresentation() {
    return mStackPresentation;
  }

  @Override
  public PointerEvents getPointerEvents() {
    return mTransitioning ? PointerEvents.NONE : PointerEvents.AUTO;
  }

  @Override
  public void setLayerType(int layerType, @Nullable Paint paint) {
    // ignore - layer type is controlled by `transitioning` prop
  }

  protected void setContainer(@Nullable ScreenContainer container) {
    mContainer = container;
  }

  protected void setFragment(Fragment fragment) {
    mFragment = fragment;
  }

  protected @Nullable Fragment getFragment() {
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
}
