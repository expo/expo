/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import android.graphics.Rect;
import android.util.SparseArray;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.RNSVGSvgViewAndroidManagerDelegate;
import com.facebook.react.viewmanagers.RNSVGSvgViewAndroidManagerInterface;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Locale;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * ViewManager for RNSVGSvgView React views. Renders as a {@link SvgView} and handles invalidating
 * the native view on view updates happening in the underlying tree.
 */
class SvgViewManager extends ReactViewManager
    implements RNSVGSvgViewAndroidManagerInterface<SvgView> {

  public static final String REACT_CLASS = "RNSVGSvgViewAndroid";

  private static final SparseArray<SvgView> mTagToSvgView = new SparseArray<>();
  private static final SparseArray<Runnable> mTagToRunnable = new SparseArray<>();

  private final ViewManagerDelegate<SvgView> mDelegate;

  protected ViewManagerDelegate getDelegate() {
    return mDelegate;
  }

  public SvgViewManager() {
    mDelegate = new RNSVGSvgViewAndroidManagerDelegate(this);
  }

  static void setSvgView(int tag, SvgView svg) {
    mTagToSvgView.put(tag, svg);
    Runnable task = mTagToRunnable.get(tag);
    if (task != null) {
      task.run();
      mTagToRunnable.delete(tag);
    }
  }

  static void runWhenViewIsAvailable(int tag, Runnable task) {
    mTagToRunnable.put(tag, task);
  }

  static @Nullable SvgView getSvgViewByTag(int tag) {
    return mTagToSvgView.get(tag);
  }

  @Nonnull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Nonnull
  @Override
  public ReactViewGroup createViewInstance(ThemedReactContext reactContext) {
    return new SvgView(reactContext);
  }

  @Override
  public void updateExtraData(ReactViewGroup root, Object extraData) {
    super.updateExtraData(root, extraData);
    root.invalidate();
  }

  @Override
  public void onDropViewInstance(@Nonnull ReactViewGroup view) {
    super.onDropViewInstance(view);
    mTagToSvgView.remove(view.getId());
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @ReactProp(name = "tintColor", customType = "Color")
  @Override
  public void setTintColor(SvgView node, Integer tintColor) {
    node.setTintColor(tintColor);
  }

  @ReactProp(name = "color", customType = "Color")
  @Override
  public void setColor(SvgView node, Integer color) {
    node.setTintColor(color);
  }

  @ReactProp(name = "minX")
  @Override
  public void setMinX(SvgView node, float minX) {
    node.setMinX(minX);
  }

  @ReactProp(name = "minY")
  @Override
  public void setMinY(SvgView node, float minY) {
    node.setMinY(minY);
  }

  @ReactProp(name = "vbWidth")
  @Override
  public void setVbWidth(SvgView node, float vbWidth) {
    node.setVbWidth(vbWidth);
  }

  @ReactProp(name = "vbHeight")
  @Override
  public void setVbHeight(SvgView node, float vbHeight) {
    node.setVbHeight(vbHeight);
  }

  @ReactProp(name = "bbWidth")
  public void setBbWidth(SvgView node, Dynamic bbWidth) {
    node.setBbWidth(bbWidth);
  }

  @ReactProp(name = "bbHeight")
  public void setBbHeight(SvgView node, Dynamic bbHeight) {
    node.setBbHeight(bbHeight);
  }

  @ReactProp(name = "align")
  @Override
  public void setAlign(SvgView node, String align) {
    node.setAlign(align);
  }

  @ReactProp(name = "meetOrSlice")
  @Override
  public void setMeetOrSlice(SvgView node, int meetOrSlice) {
    node.setMeetOrSlice(meetOrSlice);
  }

  @Override
  public void setBbWidth(SvgView view, @Nullable String value) {
    view.setBbWidth(value);
  }

  public void setBbWidth(SvgView view, @Nullable Double value) {
    view.setBbWidth(value);
  }

  @Override
  public void setBbHeight(SvgView view, @Nullable String value) {
    view.setBbHeight(value);
  }

  public void setBbHeight(SvgView view, @Nullable Double value) {
    view.setBbHeight(value);
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public void setPointerEvents(SvgView view, @Nullable String pointerEventsStr) {
    try {
      Class<?> superclass = view.getClass().getSuperclass();
      if (superclass != null) {
        Method method = superclass.getDeclaredMethod("setPointerEvents", PointerEvents.class);
        method.setAccessible(true);
        method.invoke(
            view, PointerEvents.valueOf(pointerEventsStr.toUpperCase(Locale.US).replace("-", "_")));
      }
    } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
      e.printStackTrace();
    }
  }

  @Override
  public void setHasTVPreferredFocus(SvgView view, boolean value) {
    super.setTVPreferredFocus(view, value);
  }

  @Override
  public void setBorderTopEndRadius(SvgView view, float value) {
    super.setBorderRadius(view, 6, value);
  }

  @Override
  public void setBorderBottomStartRadius(SvgView view, float value) {
    super.setBorderRadius(view, 7, value);
  }

  @Override
  public void setBorderBottomColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 4, value);
  }

  @Override
  public void setNextFocusDown(SvgView view, int value) {
    super.nextFocusDown(view, value);
  }

  @Override
  public void setBorderRightColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 2, value);
  }

  @Override
  public void setNextFocusRight(SvgView view, int value) {
    super.nextFocusRight(view, value);
  }

  @Override
  public void setBorderLeftColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 1, value);
  }

  @Override
  public void setBorderColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 0, value);
  }

  @Override
  public void setRemoveClippedSubviews(SvgView view, boolean value) {
    super.setRemoveClippedSubviews(view, value);
  }

  @Override
  public void setNextFocusForward(SvgView view, int value) {
    super.nextFocusForward(view, value);
  }

  @Override
  public void setNextFocusUp(SvgView view, int value) {
    super.nextFocusUp(view, value);
  }

  @Override
  public void setAccessible(SvgView view, boolean value) {
    super.setAccessible(view, value);
  }

  @Override
  public void setBorderStartColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 5, value);
  }

  @Override
  public void setBorderBottomEndRadius(SvgView view, float value) {
    super.setBorderRadius(view, 8, value);
  }

  @Override
  public void setBorderEndColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 6, value);
  }

  @Override
  public void setFocusable(SvgView view, boolean value) {
    super.setFocusable(view, value);
  }

  @Override
  public void setNativeBackgroundAndroid(SvgView view, @Nullable ReadableMap value) {
    super.setNativeBackground(view, value);
  }

  @Override
  public void setBorderTopStartRadius(SvgView view, float value) {
    super.setBorderRadius(view, 5, value);
  }

  @Override
  public void setNativeForegroundAndroid(SvgView view, @Nullable ReadableMap value) {
    super.setNativeForeground(view, value);
  }

  @Override
  public void setBackfaceVisibility(SvgView view, @Nullable String value) {
    super.setBackfaceVisibility(view, value);
  }

  @Override
  public void setBorderStyle(SvgView view, @Nullable String value) {
    super.setBorderStyle(view, value);
  }

  @Override
  public void setNeedsOffscreenAlphaCompositing(SvgView view, boolean value) {
    super.setNeedsOffscreenAlphaCompositing(view, value);
  }

  @Override
  public void setHitSlop(SvgView view, @Nullable ReadableMap hitSlopMap) {
    // we don't call super here since its signature changed in RN 0.69 and we want backwards
    // compatibility
    if (hitSlopMap != null) {
      view.setHitSlopRect(
          new Rect(
              hitSlopMap.hasKey("left")
                  ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("left"))
                  : 0,
              hitSlopMap.hasKey("top")
                  ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("top"))
                  : 0,
              hitSlopMap.hasKey("right")
                  ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("right"))
                  : 0,
              hitSlopMap.hasKey("bottom")
                  ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("bottom"))
                  : 0));
    }
  }

  @Override
  public void setBorderTopColor(SvgView view, @Nullable Integer value) {
    super.setBorderColor(view, 3, value);
  }

  @Override
  public void setNextFocusLeft(SvgView view, int value) {
    super.nextFocusLeft(view, value);
  }

  @Override
  public void setBorderRadius(SvgView view, double value) {
    super.setBorderRadius(view, 0, (float) value);
  }

  @Override
  public void setBorderTopLeftRadius(SvgView view, double value) {
    super.setBorderRadius(view, 1, (float) value);
  }

  @Override
  public void setBorderTopRightRadius(SvgView view, double value) {
    super.setBorderRadius(view, 2, (float) value);
  }

  @Override
  public void setBorderBottomRightRadius(SvgView view, double value) {
    super.setBorderRadius(view, 3, (float) value);
  }

  @Override
  public void setBorderBottomLeftRadius(SvgView view, double value) {
    super.setBorderRadius(view, 4, (float) value);
  }
}
