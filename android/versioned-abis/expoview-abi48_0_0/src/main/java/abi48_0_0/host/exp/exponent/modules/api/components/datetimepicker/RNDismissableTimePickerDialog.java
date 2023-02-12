/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * </p>
 */
package abi48_0_0.host.exp.exponent.modules.api.components.datetimepicker;

import static abi48_0_0.host.exp.exponent.modules.api.components.datetimepicker.ReflectionHelper.findField;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;

import android.app.TimePickerDialog;
import android.content.Context;
import android.content.res.TypedArray;
import android.os.Build;
import android.util.AttributeSet;
import android.widget.TimePicker;

import androidx.annotation.Nullable;

/**
 * <p>
 * Certain versions of Android (Jellybean-KitKat) have a bug where when dismissed, the
 * {@link TimePickerDialog} still calls the OnTimeSetListener. This class works around that issue
 * by *not* calling super.onStop on KitKat on lower, as that would erroneously call the
 * OnTimeSetListener when the dialog is dismissed, or call it twice when "OK" is pressed.
 * </p>
 *
 * <p>
 * See: <a href="https://code.google.com/p/android/issues/detail?id=34833">Issue 34833</a>
 * </p>
 */

public class RNDismissableTimePickerDialog extends MinuteIntervalSnappableTimePickerDialog {

  public RNDismissableTimePickerDialog(
    Context context,
    @Nullable TimePickerDialog.OnTimeSetListener callback,
    int hourOfDay,
    int minute,
    int minuteInterval,
    boolean is24HourView,
    RNTimePickerDisplay display
  ) {
    super(context, callback, hourOfDay, minute, minuteInterval, is24HourView, display);
    fixSpinner(context, hourOfDay, minute, is24HourView, display);
  }

  public RNDismissableTimePickerDialog(
    Context context,
    int theme,
    @Nullable TimePickerDialog.OnTimeSetListener callback,
    int hourOfDay,
    int minute,
    int minuteInterval,
    boolean is24HourView,
    RNTimePickerDisplay display
  ) {
    super(context, theme, callback, hourOfDay, minute, minuteInterval, is24HourView, display);
    fixSpinner(context, hourOfDay, minute, is24HourView, display);
  }

  @Override
  protected void onStop() {
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.KITKAT) {
      super.onStop();
    }
  }

  private void fixSpinner(Context context, int hourOfDay, int minute, boolean is24HourView, RNTimePickerDisplay display) {
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.N && display == RNTimePickerDisplay.SPINNER) {
      try {
        Class<?> styleableClass = Class.forName("com.android.internal.R$styleable");
        Field timePickerStyleableField = styleableClass.getField("TimePicker");
        int[] timePickerStyleable = (int[]) timePickerStyleableField.get(null);
        final TypedArray a = context.obtainStyledAttributes(null, timePickerStyleable, android.R.attr.timePickerStyle, 0);
        a.recycle();

        TimePicker timePicker = (TimePicker) findField(TimePickerDialog.class, TimePicker.class, "mTimePicker").get(this);
        Class<?> delegateClass = Class.forName("android.widget.TimePicker$TimePickerDelegate");
        Field delegateField = findField(TimePicker.class, delegateClass, "mDelegate");
        Object delegate = delegateField.get(timePicker);
        Class<?> spinnerDelegateClass;
        spinnerDelegateClass = Class.forName("android.widget.TimePickerSpinnerDelegate");
        // In 7.0 Nougat for some reason the timePickerMode is ignored and the delegate is TimePickerClockDelegate
        if (delegate.getClass() != spinnerDelegateClass) {
          delegateField.set(timePicker, null); // throw out the TimePickerClockDelegate!
          timePicker.removeAllViews(); // remove the TimePickerClockDelegate views
          Constructor spinnerDelegateConstructor = spinnerDelegateClass.getConstructor(TimePicker.class, Context.class, AttributeSet.class, int.class, int.class);
          spinnerDelegateConstructor.setAccessible(true);
          // Instantiate a TimePickerSpinnerDelegate
          delegate = spinnerDelegateConstructor.newInstance(timePicker, context, null, android.R.attr.timePickerStyle, 0);
          delegateField.set(timePicker, delegate); // set the TimePicker.mDelegate to the spinner delegate
          // Set up the TimePicker again, with the TimePickerSpinnerDelegate
          timePicker.setIs24HourView(is24HourView);
          timePicker.setCurrentHour(hourOfDay);
          timePicker.setCurrentMinute(minute);
          timePicker.setOnTimeChangedListener(this);
        }
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
  }
}
