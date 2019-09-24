package versioned.host.exp.exponent.modules.api.safeareacontext;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.os.Build;
import androidx.annotation.Nullable;
import android.view.Surface;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowInsets;
import android.view.WindowManager;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.views.view.ReactViewGroup;

public class SafeAreaView extends ReactViewGroup implements ViewTreeObserver.OnGlobalLayoutListener {
  public interface OnInsetsChangeListener {
    void onInsetsChange(SafeAreaView view, EdgeInsets insets);
  }

  private @Nullable
  OnInsetsChangeListener mInsetsChangeListener;
  private WindowManager mWindowManager;
  private @Nullable
  EdgeInsets mLastInsets;

  public SafeAreaView(Context context) {
    super(context);

    mWindowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
  }

  private Activity getActivity() {
    Context context = getContext();
    while (context instanceof ContextWrapper) {
      if (context instanceof Activity) {
        return (Activity) context;
      }
      context = ((ContextWrapper) context).getBaseContext();
    }
    return null;
  }

  private EdgeInsets getSafeAreaInsets() {
    // Window insets are parts of the window that are covered by system views (status bar,
    // navigation bar, notches). There are no apis the get these values for android < M so we
    // do a best effort polyfill.
    EdgeInsets windowInsets;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      WindowInsets insets = getRootWindowInsets();
      windowInsets = new EdgeInsets(
          insets.getSystemWindowInsetTop(),
          insets.getSystemWindowInsetRight(),
          insets.getSystemWindowInsetBottom(),
          insets.getSystemWindowInsetLeft());
    } else {
      int rotation = mWindowManager.getDefaultDisplay().getRotation();
      int statusBarHeight = 0;
      int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {
        statusBarHeight = getResources().getDimensionPixelSize(resourceId);
      }
      int navbarHeight = 0;
      resourceId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
      if (resourceId > 0) {
        navbarHeight = getResources().getDimensionPixelSize(resourceId);
      }

      windowInsets = new EdgeInsets(
          statusBarHeight,
          rotation == Surface.ROTATION_90 ? navbarHeight : 0,
          rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180 ? navbarHeight : 0,
          rotation == Surface.ROTATION_270 ? navbarHeight : 0);
    }

    // Calculate the part of the root view that overlaps with window insets.
    View rootView = getRootView();
    View contentView = rootView.findViewById(android.R.id.content);
    float windowWidth = rootView.getWidth();
    float windowHeight = rootView.getHeight();
    int[] windowLocation = new int[2];
    contentView.getLocationInWindow(windowLocation);
    windowInsets.top = Math.max(windowInsets.top - windowLocation[1], 0);
    windowInsets.left = Math.max(windowInsets.left - windowLocation[0], 0);
    windowInsets.bottom = Math.max(windowLocation[1] + contentView.getHeight() + windowInsets.bottom - windowHeight, 0);
    windowInsets.right = Math.max(windowLocation[0] + contentView.getWidth() + windowInsets.right - windowWidth, 0);
    return windowInsets;
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();

    getRootView().getViewTreeObserver().addOnGlobalLayoutListener(this);
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();

    getRootView().getViewTreeObserver().removeOnGlobalLayoutListener(this);
  }

  @Override
  public void onGlobalLayout() {
    EdgeInsets edgeInsets = getSafeAreaInsets();
    if (mLastInsets == null || !mLastInsets.equalsToEdgeInsets(edgeInsets)) {
      Assertions.assertNotNull(mInsetsChangeListener).onInsetsChange(this, edgeInsets);
      mLastInsets = edgeInsets;
    }
  }

  public void setOnInsetsChangeListener(OnInsetsChangeListener listener) {
    mInsetsChangeListener = listener;
  }
}
