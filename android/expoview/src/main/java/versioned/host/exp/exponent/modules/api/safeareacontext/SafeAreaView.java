package versioned.host.exp.exponent.modules.api.safeareacontext;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.ContextWrapper;
import android.view.View;
import android.view.ViewTreeObserver;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.EnumSet;

import androidx.annotation.Nullable;

@SuppressLint("ViewConstructor")
public class SafeAreaView extends ReactViewGroup implements ViewTreeObserver.OnGlobalLayoutListener {
  private @Nullable EdgeInsets mInsets;
  private @Nullable EnumSet<SafeAreaViewEdges> mEdges;

  public SafeAreaView(Context context) {
    super(context);
  }

  /**
   * UIManagerHelper.getReactContext only exists in RN 0.63+ so vendor it here for a while.
   */
  private static ReactContext getReactContext(View view) {
    Context context = view.getContext();
    if (!(context instanceof ReactContext) && context instanceof ContextWrapper) {
      context = ((ContextWrapper) context).getBaseContext();
    }
    return (ReactContext) context;
  }

  private void updateInsets() {
    if (mInsets != null) {
      EnumSet<SafeAreaViewEdges> edges = mEdges != null
              ? mEdges
              : EnumSet.allOf(SafeAreaViewEdges.class);

      SafeAreaViewLocalData localData = new SafeAreaViewLocalData(mInsets, edges);

      ReactContext reactContext = getReactContext(this);
      UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
      if (uiManager != null) {
        uiManager.setViewLocalData(getId(), localData);
      }
    }
  }

  public void setEdges(EnumSet<SafeAreaViewEdges> edges) {
    mEdges = edges;
    updateInsets();
  }

  private void maybeUpdateInsets() {
    EdgeInsets edgeInsets = SafeAreaUtils.getSafeAreaInsets(getRootView(), this);
    if (edgeInsets != null && (mInsets == null || !mInsets.equalsToEdgeInsets(edgeInsets))) {
      mInsets = edgeInsets;
      updateInsets();
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();

    getViewTreeObserver().addOnGlobalLayoutListener(this);
    maybeUpdateInsets();
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();

    getViewTreeObserver().removeOnGlobalLayoutListener(this);
  }

  @Override
  public void onGlobalLayout() {
    maybeUpdateInsets();
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    maybeUpdateInsets();
    super.onLayout(changed, left, top, right, bottom);
  }
}
