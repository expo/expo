/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import android.util.SparseArray;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.RNSVGSvgViewManagerDelegate;
import com.facebook.react.viewmanagers.RNSVGSvgViewManagerInterface;
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
class SvgViewManager extends ReactViewManager implements RNSVGSvgViewManagerInterface<SvgView> {

  private static final String REACT_CLASS = "RNSVGSvgView";

  private static final SparseArray<SvgView> mTagToSvgView = new SparseArray<>();
  private static final SparseArray<Runnable> mTagToRunnable = new SparseArray<>();

  private final ViewManagerDelegate<SvgView> mDelegate;

  protected ViewManagerDelegate getDelegate() {
    return mDelegate;
  }

  public SvgViewManager() {
    mDelegate = new RNSVGSvgViewManagerDelegate(this);
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
}
