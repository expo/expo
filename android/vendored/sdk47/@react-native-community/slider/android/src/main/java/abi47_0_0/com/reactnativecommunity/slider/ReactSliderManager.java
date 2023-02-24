/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi47_0_0.com.reactnativecommunity.slider;

import android.graphics.PorterDuffColorFilter;
import android.os.Build;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.View;
import android.widget.SeekBar;
import abi47_0_0.com.facebook.react.bridge.ReactContext;
import abi47_0_0.com.facebook.react.bridge.ReadableArray;
import abi47_0_0.com.facebook.react.bridge.ReadableMap;
import abi47_0_0.com.facebook.react.common.MapBuilder;
import abi47_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi47_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi47_0_0.com.facebook.react.uimanager.ViewProps;
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi47_0_0.com.facebook.yoga.YogaMeasureFunction;
import abi47_0_0.com.facebook.yoga.YogaMeasureMode;
import abi47_0_0.com.facebook.yoga.YogaMeasureOutput;
import abi47_0_0.com.facebook.yoga.YogaNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Manages instances of {@code ReactSlider}.
 */
public class ReactSliderManager extends SimpleViewManager<ReactSlider> {

  public static final String REACT_CLASS = "RNCSlider";

  static class ReactSliderShadowNode extends LayoutShadowNode implements
      YogaMeasureFunction {

    private int mWidth;
    private int mHeight;
    private boolean mMeasured;

    private ReactSliderShadowNode() {
      initMeasureFunction();
    }

    private void initMeasureFunction() {
      setMeasureFunction(this);
    }

    @Override
    public long measure(
        YogaNode node,
        float width,
        YogaMeasureMode widthMode,
        float height,
        YogaMeasureMode heightMode) {
      if (!mMeasured) {
        SeekBar reactSlider = new ReactSlider(getThemedContext(), null);
        final int spec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
        reactSlider.measure(spec, spec);
        mWidth = reactSlider.getMeasuredWidth();
        mHeight = reactSlider.getMeasuredHeight();
        mMeasured = true;
      }

      return YogaMeasureOutput.make(mWidth, mHeight);
    }
  }

  private static final SeekBar.OnSeekBarChangeListener ON_CHANGE_LISTENER =
      new SeekBar.OnSeekBarChangeListener() {
        @Override
        public void onProgressChanged(SeekBar seekbar, int progress, boolean fromUser) {
          ReactContext reactContext = (ReactContext) seekbar.getContext();
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSliderEvent(
                  seekbar.getId(),
                  ((ReactSlider)seekbar).toRealProgress(progress), fromUser));
        }

        @Override
        public void onStartTrackingTouch(SeekBar seekbar) {
          ReactContext reactContext = (ReactContext) seekbar.getContext();
          ((ReactSlider)seekbar).isSliding(true);
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSlidingStartEvent(
                  seekbar.getId(),
                  ((ReactSlider)seekbar).toRealProgress(seekbar.getProgress())));
        }

        @Override
        public void onStopTrackingTouch(SeekBar seekbar) {
          ReactContext reactContext = (ReactContext) seekbar.getContext();
          ((ReactSlider)seekbar).isSliding(false);
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSlidingCompleteEvent(
                  seekbar.getId(),
                  ((ReactSlider)seekbar).toRealProgress(seekbar.getProgress())));
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(
              new ReactSliderEvent(
                  seekbar.getId(),
                  ((ReactSlider)seekbar).toRealProgress(seekbar.getProgress()),
                  !((ReactSlider)seekbar).isSliding()));
        }
      };

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new ReactSliderShadowNode();
  }

  @Override
  public Class getShadowNodeClass() {
    return ReactSliderShadowNode.class;
  }

  @Override
  protected ReactSlider createViewInstance(ThemedReactContext context) {
    ReactSlider slider = new ReactSlider(context, null);

    if (Build.VERSION.SDK_INT >= 21) {
      /**
       * The "splitTrack" parameter should have "false" value,
       * otherwise the SeekBar progress line doesn't appear when it is rotated.
       */
      slider.setSplitTrack(false);
    }

    return slider;
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactSlider view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = "value", defaultDouble = 0d)
  public void setValue(ReactSlider view, double value) {
    if (view.isSliding() == false) {
      view.setValue(value);
      if (view.isAccessibilityFocused() && Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
        view.setupAccessibility((int)value);
      }
    }
  }

  @ReactProp(name = "minimumValue", defaultDouble = 0d)
  public void setMinimumValue(ReactSlider view, double value) {
    view.setMinValue(value);
  }

  @ReactProp(name = "maximumValue", defaultDouble = 1d)
  public void setMaximumValue(ReactSlider view, double value) {
    view.setMaxValue(value);
  }

  @ReactProp(name = "step", defaultDouble = 0d)
  public void setStep(ReactSlider view, double value) {
    view.setStep(value);
  }

  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactSlider view, Integer color) {
    if (view.getThumb() != null) {
      if (color == null) {
        view.getThumb().clearColorFilter();
      } else {
        view.getThumb().setColorFilter(color, PorterDuff.Mode.SRC_IN);
      }
    }
  }

  @ReactProp(name = "minimumTrackTintColor", customType = "Color")
  public void setMinimumTrackTintColor(ReactSlider view, Integer color) {
    LayerDrawable drawable = (LayerDrawable) view.getProgressDrawable().getCurrent();
    Drawable progress = drawable.findDrawableByLayerId(android.R.id.progress);
    if (color == null) {
      progress.clearColorFilter();
    } else {
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
        progress.setColorFilter(new PorterDuffColorFilter((int)color, PorterDuff.Mode.SRC_IN));
      }
      else {
        progress.setColorFilter(color, PorterDuff.Mode.SRC_IN);
      }
    }
  }

  @ReactProp(name = "thumbImage")
  public void setThumbImage(ReactSlider view, @Nullable ReadableMap source) {
    String uri = null;
    if (source != null) {
      uri = source.getString("uri");
    }
    view.setThumbImage(uri);
  }

  @ReactProp(name = "maximumTrackTintColor", customType = "Color")
  public void setMaximumTrackTintColor(ReactSlider view, Integer color) {
    LayerDrawable drawable = (LayerDrawable) view.getProgressDrawable().getCurrent();
    Drawable background = drawable.findDrawableByLayerId(android.R.id.background);
    if (color == null) {
      background.clearColorFilter();
    } else {
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
        background.setColorFilter(new PorterDuffColorFilter((int)color, PorterDuff.Mode.SRC_IN));
      }
      else {
        background.setColorFilter(color, PorterDuff.Mode.SRC_IN);
      }
    }
  }

  @ReactProp(name = "inverted", defaultBoolean = false)
  public void setInverted(ReactSlider view, boolean inverted) {
    if (inverted) view.setScaleX(-1f);
    else view.setScaleX(1f);
  }

  @ReactProp(name = "accessibilityUnits")
  public void setAccessibilityUnits(ReactSlider view, String accessibilityUnits) {
    view.setAccessibilityUnits(accessibilityUnits);
  }

  @ReactProp(name = "accessibilityIncrements")
  public void setAccessibilityIncrements(ReactSlider view, ReadableArray accessibilityIncrements) {
    List objectList = accessibilityIncrements.toArrayList();
    List<String> stringList = new ArrayList<>();
    for(Object item: objectList) {
      stringList.add((String)item);
    }
    view.setAccessibilityIncrements(stringList);
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactSlider view) {
    view.setOnSeekBarChangeListener(ON_CHANGE_LISTENER);
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(ReactSlidingCompleteEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRNCSliderSlidingComplete"),
        ReactSlidingStartEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRNCSliderSlidingStart"));
  }
}
