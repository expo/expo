package com.reactnativecommunity.slider;

import android.widget.SeekBar;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.Map;
import com.facebook.react.viewmanagers.RNCSliderManagerInterface;
import com.facebook.react.viewmanagers.RNCSliderManagerDelegate;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Manages instances of {@code ReactSlider}.
 */
@ReactModule(name = ReactSliderManagerImpl.REACT_CLASS)
public class ReactSliderManager extends SimpleViewManager<ReactSlider> implements RNCSliderManagerInterface<ReactSlider> {

  private final ViewManagerDelegate<ReactSlider> mDelegate;

  public ReactSliderManager() {
    mDelegate = new RNCSliderManagerDelegate<>(this);
  }

  @Nullable
  @Override
  protected ViewManagerDelegate<ReactSlider> getDelegate() {
    return mDelegate;
  }

  private static final SeekBar.OnSeekBarChangeListener ON_CHANGE_LISTENER =
          new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekbar, int progress, boolean fromUser) {
              ReactSlider slider = (ReactSlider)seekbar;

              if(progress < slider.getLowerLimit()) {
                progress = slider.getLowerLimit();
                seekbar.setProgress(progress);
              } else if (progress > slider.getUpperLimit()) {
                progress = slider.getUpperLimit();
                seekbar.setProgress(progress);
              }

              ReactContext reactContext = (ReactContext) seekbar.getContext();
              int reactTag = seekbar.getId();
              UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
                      .dispatchEvent(new ReactSliderEvent(reactTag, slider.toRealProgress(progress), fromUser));
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekbar) {
              ReactContext reactContext = (ReactContext) seekbar.getContext();
              int reactTag = seekbar.getId();
              ((ReactSlider)seekbar).isSliding(true);
              UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
                      .dispatchEvent(new ReactSlidingStartEvent(
                              reactTag,
                              ((ReactSlider)seekbar).toRealProgress(seekbar.getProgress())));
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekbar) {
              ReactContext reactContext = (ReactContext) seekbar.getContext();
              ((ReactSlider)seekbar).isSliding(false);
              int reactTag = seekbar.getId();

              EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag);

              eventDispatcher.dispatchEvent(
                      new ReactSlidingCompleteEvent(
                              reactTag,
                              ((ReactSlider)seekbar).toRealProgress(seekbar.getProgress()))
              );
              eventDispatcher.dispatchEvent(
                      new ReactSliderEvent(
                              reactTag,
                              ((ReactSlider)seekbar).toRealProgress(seekbar.getProgress()),
                              !((ReactSlider)seekbar).isSliding()));
            }
          };

  @Override
  public String getName() {
    return ReactSliderManagerImpl.REACT_CLASS;
  }

  @Override
  protected ReactSlider createViewInstance(ThemedReactContext context) {
    return ReactSliderManagerImpl.createViewInstance(context);
  }

  @Override
  @ReactProp(name = "disabled", defaultBoolean = false)
  public void setDisabled(ReactSlider view, boolean disabled) {
    ReactSliderManagerImpl.setDisabled(view, disabled);
  }

  @Override
  @ReactProp(name = "value", defaultFloat = 0f)
  public void setValue(ReactSlider view, float value) {
    ReactSliderManagerImpl.setValue(view, value);
  }

  @Override
  @ReactProp(name = "minimumValue", defaultFloat = 0f)
  public void setMinimumValue(ReactSlider view, float value) {
    ReactSliderManagerImpl.setMinimumValue(view, value);
  }

  @Override
  @ReactProp(name = "maximumValue", defaultFloat = 0f)
  public void setMaximumValue(ReactSlider view, float value) {
    ReactSliderManagerImpl.setMaximumValue(view, value);
  }

  @Override
  @ReactProp(name = "step", defaultFloat = 0f)
  public void setStep(ReactSlider view, float value) {
    ReactSliderManagerImpl.setStep(view, value);
  }

  @Override
  @ReactProp(name = "thumbTintColor", customType = "Color")
  public void setThumbTintColor(ReactSlider view, Integer color) {
    ReactSliderManagerImpl.setThumbTintColor(view, color);
  }

  @Override
  @ReactProp(name = "minimumTrackTintColor", customType = "Color")
  public void setMinimumTrackTintColor(ReactSlider view, Integer color) {
    ReactSliderManagerImpl.setMinimumTrackTintColor(view, color);
  }

  @Override
  @ReactProp(name = "maximumTrackTintColor", customType = "Color")
  public void setMaximumTrackTintColor(ReactSlider view, Integer color) {
    ReactSliderManagerImpl.setMaximumTrackTintColor(view, color);
  }

  @Override
  @ReactProp(name = "inverted", defaultBoolean = false)
  public void setInverted(ReactSlider view, boolean inverted) {
    ReactSliderManagerImpl.setInverted(view, inverted);
  }

  @Override
  @ReactProp(name = "accessibilityUnits")
  public void setAccessibilityUnits(ReactSlider view, String accessibilityUnits) {
    ReactSliderManagerImpl.setAccessibilityUnits(view, accessibilityUnits);
  }

  @Override
  @ReactProp(name = "accessibilityIncrements")
  public void setAccessibilityIncrements(ReactSlider view, ReadableArray accessibilityIncrements) {
    ReactSliderManagerImpl.setAccessibilityIncrements(view, accessibilityIncrements);
  }

  @ReactProp(name = "lowerLimit")
  public void setLowerLimit(ReactSlider view, float value) {
    ReactSliderManagerImpl.setLowerLimit(view, value);
  }

  @ReactProp(name = "upperLimit")
  public void setUpperLimit(ReactSlider view, float value) {
    ReactSliderManagerImpl.setUpperLimit(view, value);
  }

  @Override
  @ReactProp(name = "thumbImage")
  public void setThumbImage(ReactSlider view, @androidx.annotation.Nullable ReadableMap source) {
    ReactSliderManagerImpl.setThumbImage(view, source);
  }

  @Override
  public void setTestID(ReactSlider view, @Nullable String value) {
    super.setTestId(view, value);
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactSlider view) {
    view.setOnSeekBarChangeListener(ON_CHANGE_LISTENER);
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return ReactSliderManagerImpl.getExportedCustomDirectEventTypeConstants();
  }

  // these props are not available on Android, however we must override their setters
  @Override
  public void setMinimumTrackImage(ReactSlider view, @Nullable ReadableMap readableMap) {}

  @Override
  public void setMaximumTrackImage(ReactSlider view, @Nullable ReadableMap readableMap) {}

  @Override
  public void setTrackImage(ReactSlider view, @Nullable ReadableMap value) {}

  @Override
  public void setTapToSeek(ReactSlider view, boolean value) {}

  @Override
  public void setVertical(ReactSlider view, boolean value) {}
}
