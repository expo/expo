/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import static versioned.host.exp.exponent.modules.api.components.datetimepicker.Common.getDisplayDate;
import static versioned.host.exp.exponent.modules.api.components.datetimepicker.Common.setButtonTextColor;
import static versioned.host.exp.exponent.modules.api.components.datetimepicker.Common.setButtonTitles;

import android.annotation.SuppressLint;
import android.app.DatePickerDialog;
import android.app.DatePickerDialog.OnDateSetListener;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.content.DialogInterface.OnClickListener;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import android.widget.DatePicker;

import java.util.Calendar;
import java.util.Locale;

@SuppressLint("ValidFragment")
public class RNDatePickerDialogFragment extends DialogFragment {
  private DatePickerDialog instance;

  @Nullable
  private OnDateSetListener mOnDateSetListener;
  @Nullable
  private OnDismissListener mOnDismissListener;
  @Nullable
  private OnClickListener mOnNeutralButtonActionListener;

  @NonNull
  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    Bundle args = getArguments();
    instance = createDialog(args);
    return instance;
  }

  public void update(Bundle args) {
    final RNDate date = new RNDate(args);
    instance.updateDate(date.year(), date.month(), date.day());
  }

  static @NonNull
  DatePickerDialog getDialog(
          Bundle args,
          Context activityContext,
          @Nullable OnDateSetListener onDateSetListener) {
    final RNDate date = new RNDate(args);
    final int year = date.year();
    final int month = date.month();
    final int day = date.day();

    RNDatePickerDisplay display = getDisplayDate(args);

    if (args != null && args.getString(RNConstants.ARG_DISPLAY, null) != null) {
      display = RNDatePickerDisplay.valueOf(args.getString(RNConstants.ARG_DISPLAY).toUpperCase(Locale.US));
    }

    if (display == RNDatePickerDisplay.SPINNER) {
      return new RNDismissableDatePickerDialog(
        activityContext,
        host.exp.expoview.R.style.SpinnerDatePickerDialog,
        onDateSetListener,
        year,
        month,
        day,
        display
      );
    }
    return new RNDismissableDatePickerDialog(
      activityContext,
      onDateSetListener,
      year,
      month,
      day,
      display
    );
  }

  private DatePickerDialog createDialog(Bundle args) {
    Context activityContext = getActivity();
    DatePickerDialog dialog = getDialog(args, activityContext, mOnDateSetListener);

    if (args != null) {
      setButtonTitles(args, dialog, mOnNeutralButtonActionListener);
      if (activityContext != null) {
        RNDatePickerDisplay display = getDisplayDate(args);
        boolean needsColorOverride = display == RNDatePickerDisplay.SPINNER;
        dialog.setOnShowListener(setButtonTextColor(activityContext, dialog, args, needsColorOverride));
      }
    }

    final DatePicker datePicker = dialog.getDatePicker();
    final long minDate = Common.minDateWithTimeZone(args);
    final long maxDate = Common.maxDateWithTimeZone(args);

    if (args.containsKey(RNConstants.ARG_MINDATE)) {
      datePicker.setMinDate(minDate);
    } else {
      // This is to work around a bug in DatePickerDialog where it doesn't display a title showing
      // the date under certain conditions.
      datePicker.setMinDate(RNConstants.DEFAULT_MIN_DATE);
    }
    if (args.containsKey(RNConstants.ARG_MAXDATE)) {
      datePicker.setMaxDate(maxDate);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && (args.containsKey(RNConstants.ARG_MAXDATE) || args.containsKey(RNConstants.ARG_MINDATE))) {
      datePicker.setOnDateChangedListener((view, year, monthOfYear, dayOfMonth) -> {
        Calendar calendar = Calendar.getInstance(Common.getTimeZone(args));
        calendar.set(year, monthOfYear, dayOfMonth, 0, 0, 0);
        long timestamp = Math.min(Math.max(calendar.getTimeInMillis(), minDate), maxDate);
        calendar.setTimeInMillis(timestamp);
        if (datePicker.getYear() != calendar.get(Calendar.YEAR) || datePicker.getMonth() != calendar.get(Calendar.MONTH) || datePicker.getDayOfMonth() != calendar.get(Calendar.DAY_OF_MONTH)) {
          datePicker.updateDate(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH));
        }
      });
    }

    if (args.containsKey(RNConstants.ARG_TESTID)) {
      datePicker.setTag(args.getString(RNConstants.ARG_TESTID));
    }

    return dialog;
  }

  @Override
  public void onDismiss(@NonNull DialogInterface dialog) {
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

  /*package*/ void setOnNeutralButtonActionListener(@Nullable OnClickListener onNeutralButtonActionListener) {
    mOnNeutralButtonActionListener = onNeutralButtonActionListener;
  }
}
