/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import android.app.DatePickerDialog;
import android.content.Context;
import android.content.res.TypedArray;
import android.os.Build;
import android.util.AttributeSet;
import android.widget.DatePicker;
import androidx.annotation.Nullable;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import static versioned.host.exp.exponent.modules.api.components.datetimepicker.ReflectionHelper.findField;

/**
 * <p>
 *   Certain versions of Android (Jellybean-KitKat) have a bug where when dismissed, the
 *   {@link DatePickerDialog} still calls the OnDateSetListener. This class works around that issue.
 * </p>
 *
 * <p>
 *   See: <a href="https://code.google.com/p/android/issues/detail?id=34833">Issue 34833</a>
 * </p>
 */
public class RNDismissableDatePickerDialog extends DatePickerDialog {

  public RNDismissableDatePickerDialog(
      Context context,
      @Nullable DatePickerDialog.OnDateSetListener callback,
      int year,
      int monthOfYear,
      int dayOfMonth,
      RNDatePickerDisplay display) {
    super(context, callback, year, monthOfYear, dayOfMonth);
    fixSpinner(context, year, monthOfYear, dayOfMonth, display);
  }

  public RNDismissableDatePickerDialog(
      Context context,
      int theme,
      @Nullable DatePickerDialog.OnDateSetListener callback,
      int year,
      int monthOfYear,
      int dayOfMonth,
      RNDatePickerDisplay display) {
    super(context, theme, callback, year, monthOfYear, dayOfMonth);
    fixSpinner(context, year, monthOfYear, dayOfMonth, display);
  }

  @Override
  protected void onStop() {
    // do *not* call super.onStop() on KitKat on lower, as that would erroneously call the
    // OnDateSetListener when the dialog is dismissed, or call it twice when "OK" is pressed.
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.KITKAT) {
      super.onStop();
    }
  }

  private void fixSpinner(Context context, int year, int month, int dayOfMonth, RNDatePickerDisplay display) {
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.N && display == RNDatePickerDisplay.SPINNER) {
      try {
        // Get the theme's android:datePickerMode
        Class<?> styleableClass = Class.forName("com.android.internal.R$styleable");
        Field datePickerStyleableField = styleableClass.getField("DatePicker");
        int[] datePickerStyleable = (int[]) datePickerStyleableField.get(null);
        final TypedArray a = context.obtainStyledAttributes(null, datePickerStyleable, android.R.attr.datePickerStyle, 0);
        a.recycle();

        DatePicker datePicker = (DatePicker)findField(DatePickerDialog.class, DatePicker.class, "mDatePicker").get(this);
        Class<?> delegateClass = Class.forName("android.widget.DatePickerSpinnerDelegate");
        Field delegateField = findField(DatePicker.class, delegateClass, "mDelegate");
        Object delegate = delegateField.get(datePicker);
        Class<?> spinnerDelegateClass;
        spinnerDelegateClass = Class.forName("android.widget.DatePickerSpinnerDelegate");

        // In 7.0 Nougat for some reason the datePickerMode is ignored and the delegate is
        // DatePickerClockDelegate
        if (delegate.getClass() != spinnerDelegateClass) {
          delegateField.set(datePicker, null); // throw out the DatePickerClockDelegate!
          datePicker.removeAllViews(); // remove the DatePickerClockDelegate views
          Method createSpinnerUIDelegate =
              DatePicker.class.getDeclaredMethod(
                  "createSpinnerUIDelegate",
                  Context.class,
                  AttributeSet.class,
                  int.class,
                  int.class);
          createSpinnerUIDelegate.setAccessible(true);

          // Instantiate a DatePickerSpinnerDelegate throughout createSpinnerUIDelegate method
          delegate = createSpinnerUIDelegate.invoke(datePicker, context, null, android.R.attr.datePickerStyle, 0);
          delegateField.set(datePicker, delegate); // set the DatePicker.mDelegate to the spinner delegate
          datePicker.setCalendarViewShown(false);
          // Initialize the date for the DatePicker delegate again
          datePicker.init(year, month, dayOfMonth, this);
        }
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
    if (display == RNDatePickerDisplay.SPINNER){
      if(this.getDatePicker() != null)
        this.getDatePicker().setCalendarViewShown(false);
    }
  }
}
