/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.reactnativecommunity.slider;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.os.Build;
import android.util.AttributeSet;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityManager;
import androidx.appcompat.widget.AppCompatSeekBar;
import java.net.URL;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import javax.annotation.Nullable;
import com.facebook.react.modules.i18nmanager.I18nUtil;
/**
 * Slider that behaves more like the iOS one, for consistency.
 *
 * <p>On iOS, the value is 0..1. Android SeekBar only supports integer values. For consistency, we
 * pretend in JS that the value is 0..1 but set the SeekBar value to 0..100.
 *
 * <p>Note that the slider is _not_ a controlled component (setValue isn't called during dragging).
 */
public class ReactSlider extends AppCompatSeekBar {

  /**
   * If step is 0 (unset) we default to this total number of steps. Don't use 100 which leads to
   * rounding errors (0.200000000001).
   */
  private static int DEFAULT_TOTAL_STEPS = 128;

  /**
   * We want custom min..max range. Android only supports 0..max range so we implement this
   * ourselves.
   */
  private double mMinValue = 0;

  private double mMaxValue = 0;

  /**
   * Value sent from JS (setState). Doesn't get updated during drag (slider is not a controlled
   * component).
   */
  private double mValue = 0;

  private boolean isSliding = false;

  /** If zero it's determined automatically. */
  private double mStep = 0;

  private double mStepCalculated = 0;

  private String mAccessibilityUnits;

  private List<String> mAccessibilityIncrements;

  public ReactSlider(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    super.setLayoutDirection(sharedI18nUtilInstance.isRTL(context) ? LAYOUT_DIRECTION_RTL : LAYOUT_DIRECTION_LTR);
    disableStateListAnimatorIfNeeded();
  }

  private void disableStateListAnimatorIfNeeded() {
    // We disable the state list animator for Android 6 and 7; this is a hack to prevent T37452851
    // and https://github.com/facebook/react-native/issues/9979
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
        && Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      super.setStateListAnimator(null);
    }
  }

  /* package */ void setMaxValue(double max) {
    mMaxValue = max;
    updateAll();
  }

  /* package */ void setMinValue(double min) {
    mMinValue = min;
    updateAll();
  }

  /* package */ void setValue(double value) {
    mValue = value;
    updateValue();
  }

  /* package */ void setStep(double step) {
    mStep = step;
    updateAll();
  }

  boolean isSliding() {
    return isSliding;
  }

  void isSliding(boolean isSliding) {
    this.isSliding = isSliding;
  }

  void setAccessibilityUnits(String accessibilityUnits) {
    mAccessibilityUnits = accessibilityUnits;
  }

  void setAccessibilityIncrements(List<String> accessibilityIncrements) {
    mAccessibilityIncrements = accessibilityIncrements;
  }

  @Override
  public void onPopulateAccessibilityEvent(AccessibilityEvent event) {
    super.onPopulateAccessibilityEvent(event);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUSED ||
          (event.getEventType() == AccessibilityEvent.TYPE_VIEW_SELECTED && this.isAccessibilityFocused())) {
          this.setupAccessibility((int)mValue);
      }
    }
  }

  @Override
  public void announceForAccessibility(CharSequence text) {
    Context ctx = this.getContext();
    final AccessibilityManager manager = (AccessibilityManager) ctx.getSystemService(Context.ACCESSIBILITY_SERVICE);

    if (manager.isEnabled()) {
      final AccessibilityEvent e = AccessibilityEvent.obtain();
      e.setEventType(AccessibilityEvent.TYPE_ANNOUNCEMENT);
      e.setClassName(this.getClass().getName());
      e.setPackageName(ctx.getPackageName());
      e.getText().add(text);

      TimerTask task = new TimerTask() {
        @Override
        public void run() {
          manager.sendAccessibilityEvent(e);
        }
      };

      Timer timer = new Timer();
      timer.schedule(task, 1000);
    }
  }

  public void setupAccessibility(int index) {
    if (mAccessibilityUnits != null && mAccessibilityIncrements != null && mAccessibilityIncrements.size() - 1 == (int)mMaxValue) {
      String sliderValue = mAccessibilityIncrements.get(index);
      int stringLength = mAccessibilityUnits.length();

      String spokenUnits = mAccessibilityUnits;
      if (sliderValue != null && Integer.parseInt(sliderValue) == 1) {
        spokenUnits = spokenUnits.substring(0, stringLength - 1);
      }

      this.announceForAccessibility(String.format("%s %s", sliderValue, spokenUnits));
    }
  }



  /**
   * Convert SeekBar's native progress value (e.g. 0..100) to a value passed to JS (e.g. -1.0..2.5).
   */
  public double toRealProgress(int seekBarProgress) {
    if (seekBarProgress == getMax()) {
      return mMaxValue;
    }
    return seekBarProgress * getStepValue() + mMinValue;
  }

  /** Update underlying native SeekBar's values. */
  private void updateAll() {
    if (mStep == 0) {
      mStepCalculated = (mMaxValue - mMinValue) / (double) DEFAULT_TOTAL_STEPS;
    }
    setMax(getTotalSteps());
    updateValue();
  }

  /** Update value only (optimization in case only value is set). */
  private void updateValue() {
    setProgress((int) Math.round((mValue - mMinValue) / (mMaxValue - mMinValue) * getTotalSteps()));
  }

  private int getTotalSteps() {
    return (int) Math.ceil((mMaxValue - mMinValue) / getStepValue());
  }

  private double getStepValue() {
    return mStep > 0 ? mStep : mStepCalculated;
  }

  private BitmapDrawable getBitmapDrawable(final String uri) {
    BitmapDrawable bitmapDrawable = null;
    ExecutorService executorService = Executors.newSingleThreadExecutor();
    Future<BitmapDrawable> future = executorService.submit(new Callable<BitmapDrawable>() {
      @Override
      public BitmapDrawable call() {
        BitmapDrawable bitmapDrawable = null;
        try {
          Bitmap bitmap = null;
          if (uri.startsWith("http://") || uri.startsWith("https://") ||
              uri.startsWith("file://") || uri.startsWith("asset://") || uri.startsWith("data:")) {
            bitmap = BitmapFactory.decodeStream(new URL(uri).openStream());
          } else {
            int drawableId = getResources()
                .getIdentifier(uri, "drawable", getContext()
                .getPackageName());
            bitmap = BitmapFactory.decodeResource(getResources(), drawableId);
          }

          bitmapDrawable = new BitmapDrawable(getResources(), bitmap);
        } catch (Exception e) {
          e.printStackTrace();
        }
        return bitmapDrawable;
      }
    });
    try {
      bitmapDrawable = future.get();
    } catch (Exception e) {
      e.printStackTrace();
    }
    return bitmapDrawable;
  }

  public void setThumbImage(final String uri) {
    if (uri != null) {
      setThumb(getBitmapDrawable(uri));
      // Enable alpha channel for the thumbImage
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        setSplitTrack(false);
      }
    } else {
      setThumb(getThumb());
    }
  }
}
