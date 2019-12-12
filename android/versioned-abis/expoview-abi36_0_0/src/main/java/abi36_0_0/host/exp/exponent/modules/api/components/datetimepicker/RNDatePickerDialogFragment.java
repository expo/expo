/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi36_0_0.host.exp.exponent.modules.api.components.datetimepicker;

import javax.annotation.Nullable;

import java.util.Calendar;
import java.util.Locale;
import android.annotation.SuppressLint;

import android.app.DatePickerDialog;
import android.app.DatePickerDialog.OnDateSetListener;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.os.Build;
import android.os.Bundle;
import androidx.fragment.app.DialogFragment;
import android.widget.DatePicker;

@SuppressLint("ValidFragment")
public class RNDatePickerDialogFragment extends DialogFragment {
  private DatePickerDialog instance;

  @Nullable
  private OnDateSetListener mOnDateSetListener;
  @Nullable
  private OnDismissListener mOnDismissListener;

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    Bundle args = getArguments();
    instance = createDialog(args, getActivity(), mOnDateSetListener);
    return instance;
  }

  public void update(Bundle args) {
    final RNDate date = new RNDate(args);
    instance.updateDate(date.year(), date.month(), date.day());
  }

  static DatePickerDialog createDialog(Bundle args, Context activityContext, @Nullable OnDateSetListener onDateSetListener) {
    final Calendar c = Calendar.getInstance();
    final RNDate date = new RNDate(args);
    final int year = date.year();
    final int month = date.month();
    final int day = date.day();

    RNDatePickerDisplay display = RNDatePickerDisplay.DEFAULT;
    DatePickerDialog dialog = null;

    if (args != null && args.getString(RNConstants.ARG_DISPLAY, null) != null) {
      display = RNDatePickerDisplay.valueOf(args.getString(RNConstants.ARG_DISPLAY).toUpperCase(Locale.US));
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      switch (display) {
        case CALENDAR:
          dialog = new RNDismissableDatePickerDialog(activityContext,
            activityContext.getResources().getIdentifier("CalendarDatePickerDialog", "style", activityContext.getPackageName()),
            onDateSetListener, year, month, day);
          break;
        case SPINNER:
          dialog = new RNDismissableDatePickerDialog(activityContext,
            activityContext.getResources().getIdentifier("SpinnerDatePickerDialog", "style", activityContext.getPackageName()),
            onDateSetListener, year, month, day);
          break;
        case DEFAULT:
          dialog = new RNDismissableDatePickerDialog(activityContext, onDateSetListener, year, month, day);
          break;
      }
    } else {
      dialog = new RNDismissableDatePickerDialog(activityContext, onDateSetListener, year, month, day);

      switch (display) {
        case CALENDAR:
          dialog.getDatePicker().setCalendarViewShown(true);
          dialog.getDatePicker().setSpinnersShown(false);
          break;
        case SPINNER:
          dialog.getDatePicker().setCalendarViewShown(false);
          break;
      }
    }

    final DatePicker datePicker = dialog.getDatePicker();

    if (args != null && args.containsKey(RNConstants.ARG_MINDATE)) {
      // Set minDate to the beginning of the day. We need this because of clowniness in datepicker
      // that causes it to throw an exception if minDate is greater than the internal timestamp
      // that it generates from the y/m/d passed in the constructor.
      c.setTimeInMillis(args.getLong(RNConstants.ARG_MINDATE));
      c.set(Calendar.HOUR_OF_DAY, 0);
      c.set(Calendar.MINUTE, 0);
      c.set(Calendar.SECOND, 0);
      c.set(Calendar.MILLISECOND, 0);
      datePicker.setMinDate(c.getTimeInMillis());
    } else {
      // This is to work around a bug in DatePickerDialog where it doesn't display a title showing
      // the date under certain conditions.
      datePicker.setMinDate(RNConstants.DEFAULT_MIN_DATE);
    }
    if (args != null && args.containsKey(RNConstants.ARG_MAXDATE)) {
      // Set maxDate to the end of the day, same reason as for minDate.
      c.setTimeInMillis(args.getLong(RNConstants.ARG_MAXDATE));
      c.set(Calendar.HOUR_OF_DAY, 23);
      c.set(Calendar.MINUTE, 59);
      c.set(Calendar.SECOND, 59);
      c.set(Calendar.MILLISECOND, 999);
      datePicker.setMaxDate(c.getTimeInMillis());
    }

    return dialog;
  }

  @Override
  public void onDismiss(DialogInterface dialog) {
    super.onDismiss(dialog);
    if (mOnDismissListener != null) {
      mOnDismissListener.onDismiss(dialog);
    }
  }

  /*package*/ void setOnDateSetListener(@Nullable OnDateSetListener onDateSetListener) {
    mOnDateSetListener = onDateSetListener;
  }

  /*package*/ void setOnDismissListener(@Nullable OnDismissListener onDismissListener) {
    mOnDismissListener = onDismissListener;
  }
}
