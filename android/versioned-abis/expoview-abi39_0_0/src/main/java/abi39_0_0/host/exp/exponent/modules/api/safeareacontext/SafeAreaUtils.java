package abi39_0_0.host.exp.exponent.modules.api.safeareacontext;

import android.graphics.Rect;
import android.os.Build;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;

import androidx.annotation.Nullable;

/* package */ class SafeAreaUtils {

  private static @Nullable EdgeInsets getRootWindowInsetsCompat(View rootView) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      WindowInsets insets = rootView.getRootWindowInsets();
      if (insets == null) {
        return null;
      }
      return new EdgeInsets(
          insets.getSystemWindowInsetTop(),
          insets.getSystemWindowInsetRight(),
          // System insets are more reliable to account for notches but the
          // system inset for bottom includes the soft keyboard which we don't
          // want to be consistent with iOS. In practice it should always be
          // correct since there cannot be a notch on this edge.
          insets.getStableInsetBottom(),
          insets.getSystemWindowInsetLeft());
    } else {
      Rect visibleRect = new Rect();
      rootView.getWindowVisibleDisplayFrame(visibleRect);
      return new EdgeInsets(
          visibleRect.top,
          rootView.getWidth() - visibleRect.right,
          rootView.getHeight() - visibleRect.bottom,
          visibleRect.left);
    }
  }

  static @Nullable EdgeInsets getSafeAreaInsets(View view) {
    // The view has not been layout yet.
    if (view.getHeight() == 0) {
      return null;
    }
    View rootView = view.getRootView();
    EdgeInsets windowInsets = getRootWindowInsetsCompat(rootView);
    if (windowInsets == null) {
      return null;
    }

    // Calculate the part of the view that overlaps with window insets.
    float windowWidth = rootView.getWidth();
    float windowHeight = rootView.getHeight();
    Rect visibleRect = new Rect();
    view.getGlobalVisibleRect(visibleRect);

    windowInsets.top = Math.max(windowInsets.top - visibleRect.top, 0);
    windowInsets.left = Math.max(windowInsets.left - visibleRect.left, 0);
    windowInsets.bottom = Math.max(visibleRect.top + view.getHeight() + windowInsets.bottom - windowHeight, 0);
    windowInsets.right = Math.max(visibleRect.left + view.getWidth() + windowInsets.right - windowWidth, 0);
    return windowInsets;
  }

  static @Nullable abi39_0_0.host.exp.exponent.modules.api.safeareacontext.Rect getFrame(ViewGroup rootView, View view) {
    // This can happen while the view gets unmounted.
    if (view.getParent() == null) {
      return null;
    }
    Rect offset = new Rect();
    view.getDrawingRect(offset);
    try {
      rootView.offsetDescendantRectToMyCoords(view, offset);
    } catch (IllegalArgumentException ex) {
      // This can throw if the view is not a descendant of rootView. This should not
      // happen but avoid potential crashes.
      ex.printStackTrace();
      return null;
    }

    return new abi39_0_0.host.exp.exponent.modules.api.safeareacontext.Rect(offset.left, offset.top, view.getWidth(), view.getHeight());
  }
}
