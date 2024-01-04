package com.reactnativecommunity.slider;

import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class ReactSliderManagerImpl {

    public static final String REACT_CLASS = "RNCSlider";

    public static ReactSlider createViewInstance(ThemedReactContext context) {
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

    public static void setValue(ReactSlider view, double value) {
        if (view.isSliding() == false) {
            view.setValue(value);
            if (view.isAccessibilityFocused() && Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
                view.setupAccessibility((int)value);
            }
        }
    }

    public static void setMinimumValue(ReactSlider view, float value) {
        view.setMinValue(value);
    }

    public static void setMaximumValue(ReactSlider view, float value) {
        view.setMaxValue(value);
    }

    public static void setLowerLimit(ReactSlider view, double value) {
        view.setLowerLimit(value);
    }

    public static void setUpperLimit(ReactSlider view, double value) {
        view.setUpperLimit(value);
    }

    public static void setStep(ReactSlider view, float value) {
        view.setStep(value);
    }

    public static void setDisabled(ReactSlider view, boolean disabled) {
        view.setEnabled(!disabled);
    }

    public static void setThumbTintColor(ReactSlider view, Integer color) {
        if (view.getThumb() != null) {
            if (color == null) {
                view.getThumb().clearColorFilter();
            } else {
                view.getThumb().setColorFilter(color, PorterDuff.Mode.SRC_IN);
            }
        }
    }

    public static void setMinimumTrackTintColor(ReactSlider view, Integer color) {
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

    public static void setThumbImage(ReactSlider view, @Nullable ReadableMap source) {
        String uri = null;
        if (source != null) {
            uri = source.getString("uri");
        }
        view.setThumbImage(uri);
    }

    public static void setMaximumTrackTintColor(ReactSlider view, Integer color) {
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

    public static void setInverted(ReactSlider view, boolean inverted) {
        if (inverted) view.setScaleX(-1f);
        else view.setScaleX(1f);
    }

    public static void setAccessibilityUnits(ReactSlider view, String accessibilityUnits) {
        view.setAccessibilityUnits(accessibilityUnits);
    }

    public static void setAccessibilityIncrements(ReactSlider view, ReadableArray accessibilityIncrements) {
        List objectList = accessibilityIncrements.toArrayList();
        List<String> stringList = new ArrayList<>();
        for(Object item: objectList) {
            stringList.add((String)item);
        }
        view.setAccessibilityIncrements(stringList);
    }

    public static Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of(ReactSlidingCompleteEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRNCSliderSlidingComplete"),
                ReactSlidingStartEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRNCSliderSlidingStart"));
    }
}
