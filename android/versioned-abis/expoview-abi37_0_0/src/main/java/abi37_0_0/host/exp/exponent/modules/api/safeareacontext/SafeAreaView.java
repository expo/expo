package abi37_0_0.host.exp.exponent.modules.api.safeareacontext;

import android.content.Context;
import android.graphics.Rect;
import android.os.Build;
import android.view.Surface;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowInsets;
import android.view.WindowManager;

import com.facebook.infer.annotation.Assertions;
import abi37_0_0.com.facebook.react.views.view.ReactViewGroup;

import androidx.annotation.Nullable;

public class SafeAreaView extends ReactViewGroup implements ViewTreeObserver.OnGlobalLayoutListener {
  public interface OnInsetsChangeListener {
    void onInsetsChange(SafeAreaView view, EdgeInsets insets);
  }

  private @Nullable OnInsetsChangeListener mInsetsChangeListener;
  private final WindowManager mWindowManager;
  private @Nullable EdgeInsets mLastInsets;

  public SafeAreaView(Context context, WindowManager windowManager) {
    super(context);

    mWindowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
  }

  private void maybeUpdateInsets() {
    EdgeInsets edgeInsets = SafeAreaUtils.getSafeAreaInsets(mWindowManager, getRootView());
    if (edgeInsets != null && (mLastInsets == null || !mLastInsets.equalsToEdgeInsets(edgeInsets))) {
      Assertions.assertNotNull(mInsetsChangeListener).onInsetsChange(this, edgeInsets);
      mLastInsets = edgeInsets;
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

  public void setOnInsetsChangeListener(OnInsetsChangeListener listener) {
    mInsetsChangeListener = listener;
  }
}
