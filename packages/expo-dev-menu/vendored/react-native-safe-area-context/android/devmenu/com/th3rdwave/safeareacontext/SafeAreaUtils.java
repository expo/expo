package devmenu.com.th3rdwave.safeareacontext;

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
        // want to be consistent with iOS. Using the min value makes sure we
        // never get the keyboard offset while still working with devices that
        // hide the navigation bar.
        Math.min(insets.getSystemWindowInsetBottom(), insets.getStableInsetBottom()),
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

    windowInsets.setTop(Math.max(windowInsets.getTop() - visibleRect.top, 0));
    windowInsets.setLeft(Math.max(windowInsets.getLeft() - visibleRect.left, 0));
    windowInsets.setBottom(Math.max(Math.min(visibleRect.top + view.getHeight() - windowHeight, 0) + windowInsets.getBottom(), 0));
    windowInsets.setRight(Math.max(Math.min(visibleRect.left + view.getWidth() - windowWidth, 0) + windowInsets.getRight(), 0));
    return windowInsets;
  }

  static @Nullable devmenu.com.th3rdwave.safeareacontext.Rect getFrame(ViewGroup rootView, View view) {
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

    return new devmenu.com.th3rdwave.safeareacontext.Rect(offset.left, offset.top, view.getWidth(), view.getHeight());
  }
}
