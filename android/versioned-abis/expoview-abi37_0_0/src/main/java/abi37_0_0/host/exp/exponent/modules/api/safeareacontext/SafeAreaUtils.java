package abi37_0_0.host.exp.exponent.modules.api.safeareacontext;

import android.graphics.Rect;
import android.os.Build;
import android.view.Surface;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;

import abi37_0_0.com.facebook.react.bridge.Arguments;
import abi37_0_0.com.facebook.react.bridge.WritableMap;
import abi37_0_0.com.facebook.react.common.MapBuilder;
import abi37_0_0.com.facebook.react.uimanager.PixelUtil;

import java.util.Map;

import androidx.annotation.Nullable;

/* package */ class SafeAreaUtils {
  static WritableMap edgeInsetsToJsMap(EdgeInsets insets) {
    WritableMap insetsMap = Arguments.createMap();
    insetsMap.putDouble("top", PixelUtil.toDIPFromPixel(insets.top));
    insetsMap.putDouble("right", PixelUtil.toDIPFromPixel(insets.right));
    insetsMap.putDouble("bottom", PixelUtil.toDIPFromPixel(insets.bottom));
    insetsMap.putDouble("left", PixelUtil.toDIPFromPixel(insets.left));
    return insetsMap;
  }

  static Map<String, Float> edgeInsetsToJavaMap(EdgeInsets insets) {
    return MapBuilder.of(
        "top",
        PixelUtil.toDIPFromPixel(insets.top),
        "right",
        PixelUtil.toDIPFromPixel(insets.right),
        "bottom",
        PixelUtil.toDIPFromPixel(insets.bottom),
        "left",
        PixelUtil.toDIPFromPixel(insets.left));
  }

  static @Nullable EdgeInsets getSafeAreaInsets(WindowManager windowManager, View rootView) {
    // Window insets are parts of the window that are covered by system views (status bar,
    // navigation bar, notches). There are no apis the get these values for android < M so we
    // do a best effort polyfill.
    EdgeInsets windowInsets;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      WindowInsets insets = rootView.getRootWindowInsets();
      if (insets == null) {
        return null;
      }
      windowInsets = new EdgeInsets(
          insets.getSystemWindowInsetTop(),
          insets.getSystemWindowInsetRight(),
          insets.getSystemWindowInsetBottom(),
          insets.getSystemWindowInsetLeft());
    } else {
      int rotation = windowManager.getDefaultDisplay().getRotation();
      int statusBarHeight = 0;
      int resourceId = rootView.getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {
        statusBarHeight = rootView.getResources().getDimensionPixelSize(resourceId);
      }
      int navbarHeight = 0;
      resourceId = rootView.getResources().getIdentifier("navigation_bar_height", "dimen", "android");
      if (resourceId > 0) {
        navbarHeight = rootView.getResources().getDimensionPixelSize(resourceId);
      }

      windowInsets = new EdgeInsets(
          statusBarHeight,
          rotation == Surface.ROTATION_90 ? navbarHeight : 0,
          rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180 ? navbarHeight : 0,
          rotation == Surface.ROTATION_270 ? navbarHeight : 0);
    }

    // Calculate the part of the root view that overlaps with window insets.
    View contentView = rootView.findViewById(android.R.id.content);
    float windowWidth = rootView.getWidth();
    float windowHeight = rootView.getHeight();
    Rect visibleRect = new Rect();
    contentView.getGlobalVisibleRect(visibleRect);

    windowInsets.top = Math.max(windowInsets.top - visibleRect.top, 0);
    windowInsets.left = Math.max(windowInsets.left - visibleRect.left, 0);
    windowInsets.bottom = Math.max(visibleRect.top + contentView.getHeight() + windowInsets.bottom - windowHeight, 0);
    windowInsets.right = Math.max(visibleRect.left + contentView.getWidth() + windowInsets.right - windowWidth, 0);
    return windowInsets;
  }
}
