package com.swmansion.reanimated;

import android.graphics.Matrix;
import android.graphics.RectF;
import android.util.Log;
import android.view.View;
import android.view.ViewParent;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.RootViewUtil;
import com.facebook.react.views.scroll.ReactHorizontalScrollView;
import com.facebook.react.views.scroll.ReactScrollView;
import com.facebook.react.views.swiperefresh.ReactSwipeRefreshLayout;

public class NativeMethodsHelper {

  public static float[] measure(View view) {
    View rootView = (View) RootViewUtil.getRootView(view);
    if (rootView == null || view == null) {
      float result[] = new float[6];
      result[0] = -1234567;
      return result;
    }

    int buffer[] = new int[4];
    computeBoundingBox(rootView, buffer);
    int rootX = buffer[0];
    int rootY = buffer[1];
    computeBoundingBox(view, buffer);
    buffer[0] -= rootX;
    buffer[1] -= rootY;

    float result[] = new float[6];
    result[0] = result[1] = 0;
    for (int i = 2; i < 6; ++i) result[i] = PixelUtil.toDIPFromPixel(buffer[i - 2]);

    return result;
  }

  public static void scrollTo(View view, double argX, double argY, boolean animated) {
    int x = Math.round(PixelUtil.toPixelFromDIP(argX));
    int y = Math.round(PixelUtil.toPixelFromDIP(argY));
    boolean isHorizontal = view instanceof ReactHorizontalScrollView;

    if (!isHorizontal) {
      if (view instanceof ReactSwipeRefreshLayout) {
        view = findScrollView((ReactSwipeRefreshLayout) view);
      }
      if (!(view instanceof ReactScrollView)) {
        Log.w(
            "REANIMATED",
            "NativeMethodsHelper: Unhandled scroll view type - allowed only {ReactScrollView, ReactHorizontalScrollView}");
        return;
      }
    }

    if (animated) {
      final View finalView = view;
      if (isHorizontal) {
        view.post(() -> ((ReactHorizontalScrollView) finalView).smoothScrollTo(x, y));
      } else {
        view.post(() -> ((ReactScrollView) finalView).smoothScrollTo(x, y));
      }
    } else {
      view.scrollTo(x, y);
    }
  }

  private static ReactScrollView findScrollView(ReactSwipeRefreshLayout view) {
    for (int i = 0; i < view.getChildCount(); i++) {
      if (view.getChildAt(i) instanceof ReactScrollView) {
        return (ReactScrollView) view.getChildAt(i);
      }
    }
    return null;
  }

  private static void computeBoundingBox(View view, int[] outputBuffer) {
    RectF boundingBox = new RectF();
    boundingBox.set(0, 0, view.getWidth(), view.getHeight());
    mapRectFromViewToWindowCoords(view, boundingBox);

    outputBuffer[0] = Math.round(boundingBox.left);
    outputBuffer[1] = Math.round(boundingBox.top);
    outputBuffer[2] = Math.round(boundingBox.right - boundingBox.left);
    outputBuffer[3] = Math.round(boundingBox.bottom - boundingBox.top);
  }

  private static void mapRectFromViewToWindowCoords(View view, RectF rect) {
    Matrix matrix = view.getMatrix();
    if (!matrix.isIdentity()) {
      matrix.mapRect(rect);
    }

    rect.offset(view.getLeft(), view.getTop());

    ViewParent parent = view.getParent();
    while (parent instanceof View) {
      View parentView = (View) parent;

      rect.offset(-parentView.getScrollX(), -parentView.getScrollY());

      matrix = parentView.getMatrix();
      if (!matrix.isIdentity()) {
        matrix.mapRect(rect);
      }

      rect.offset(parentView.getLeft(), parentView.getTop());

      parent = parentView.getParent();
    }
  }
}
