/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi48_0_0.host.exp.exponent.modules.api.components.datetimepicker;

import android.app.DatePickerDialog.OnDateSetListener;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.content.DialogInterface.OnClickListener;
import android.os.Bundle;
import android.widget.DatePicker;
import androidx.annotation.NonNull;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import abi48_0_0.com.facebook.react.bridge.*;
import abi48_0_0.com.facebook.react.common.annotations.VisibleForTesting;
import abi48_0_0.com.facebook.react.module.annotations.ReactModule;

import static abi48_0_0.host.exp.exponent.modules.api.components.datetimepicker.Common.dismissDialog;
import static abi48_0_0.host.exp.exponent.modules.api.components.datetimepicker.KeepDateInRangeListener.isDateAfterMaxDate;
import static abi48_0_0.host.exp.exponent.modules.api.components.datetimepicker.KeepDateInRangeListener.isDateBeforeMinDate;

import java.util.Calendar;

/**
 * {@link NativeModule} that allows JS to show a native date picker dialog and get called back when
 * the user selects a date.
 */
@ReactModule(name = RNDatePickerDialogModule.FRAGMENT_TAG)
public class RNDatePickerDialogModule extends ReactContextBaseJavaModule {

  @VisibleForTesting
  public static final String FRAGMENT_TAG = "RNDatePickerAndroid";

  public RNDatePickerDialogModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public @NonNull String getName() {
    return RNDatePickerDialogModule.FRAGMENT_TAG;
  }

  private class DatePickerDialogListener implements OnDateSetListener, OnDismissListener, OnClickListener {

    private final Promise mPromise;
    private final Bundle mArgs;
    private boolean mPromiseResolved = false;

    public DatePickerDialogListener(final Promise promise, Bundle arguments) {
      mPromise = promise;
      mArgs = arguments;
    }

    @Override
    public void onDateSet(DatePicker view, int year, int month, int day) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveReactInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", RNConstants.ACTION_DATE_SET);
        result.putInt("year", year);
        result.putInt("month", month);
        result.putInt("day", day);

        // https://issuetracker.google.com/issues/169602180
        // TODO revisit day, month, year with timezoneoffset fixes
        if (isDateAfterMaxDate(mArgs, year, month, day)) {
          Calendar maxDate = Calendar.getInstance();
          maxDate.setTimeInMillis(mArgs.getLong(RNConstants.ARG_MAXDATE));

          result.putInt("year", maxDate.get(Calendar.YEAR));
          result.putInt("month", maxDate.get(Calendar.MONTH) );
          result.putInt("day", maxDate.get(Calendar.DAY_OF_MONTH));
        }

        if (isDateBeforeMinDate(mArgs, year, month, day)) {
          Calendar minDate = Calendar.getInstance();
          minDate.setTimeInMillis(mArgs.getLong(RNConstants.ARG_MINDATE));

          result.putInt("year", minDate.get(Calendar.YEAR));
          result.putInt("month", minDate.get(Calendar.MONTH) );
          result.putInt("day", minDate.get(Calendar.DAY_OF_MONTH));
        }

        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }

    @Override
    public void onDismiss(DialogInterface dialog) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveReactInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", RNConstants.ACTION_DISMISSED);
        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveReactInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", RNConstants.ACTION_NEUTRAL_BUTTON);
        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }
  }

  @ReactMethod
  public void dismiss(Promise promise) {
    FragmentActivity activity = (FragmentActivity) getCurrentActivity();
    dismissDialog(activity, FRAGMENT_TAG, promise);
  }
  /**
   * Show a date picker dialog.
   *
   * @param options a map containing options. Available keys are:
   *
   * <ul>
   *   <li>{@code date} (timestamp in milliseconds) the date to show by default</li>
   *   <li>
   *     {@code minimumDate} (timestamp in milliseconds) the minimum date the user should be allowed
   *     to select
   *   </li>
   *   <li>
   *     {@code maximumDate} (timestamp in milliseconds) the maximum date the user should be allowed
   *     to select
   *    </li>
   *   <li>
   *      {@code display} To set the date picker display to 'calendar/spinner/default'
   *   </li>
   * </ul>
   *
   * @param promise This will be invoked with parameters action, year,
   *                month (0-11), day, where action is {@code dateSetAction} or
   *                {@code dismissedAction}, depending on what the user did. If the action is
   *                dismiss, year, month and date are undefined.
   */
  @ReactMethod
  public void open(final ReadableMap options, final Promise promise) {
    FragmentActivity activity = (FragmentActivity) getCurrentActivity();
    if (activity == null) {
      promise.reject(
        RNConstants.ERROR_NO_ACTIVITY,
        "Tried to open a DatePicker dialog while not attached to an Activity");
      return;
    }

    final FragmentManager fragmentManager = activity.getSupportFragmentManager();

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        RNDatePickerDialogFragment oldFragment =
                (RNDatePickerDialogFragment) fragmentManager.findFragmentByTag(FRAGMENT_TAG);

        if (oldFragment != null) {
          oldFragment.update(createFragmentArguments(options));
          return;
        }

        RNDatePickerDialogFragment fragment = new RNDatePickerDialogFragment();

        fragment.setArguments(createFragmentArguments(options));

        final DatePickerDialogListener listener = new DatePickerDialogListener(promise, createFragmentArguments(options));
        fragment.setOnDismissListener(listener);
        fragment.setOnDateSetListener(listener);
        fragment.setOnNeutralButtonActionListener(listener);
        fragment.show(fragmentManager, FRAGMENT_TAG);
      }
    });
  }

  private Bundle createFragmentArguments(ReadableMap options) {
    final Bundle args = new Bundle();
    if (options.hasKey(RNConstants.ARG_VALUE) && !options.isNull(RNConstants.ARG_VALUE)) {
      args.putLong(RNConstants.ARG_VALUE, (long) options.getDouble(RNConstants.ARG_VALUE));
    }
    if (options.hasKey(RNConstants.ARG_MINDATE) && !options.isNull(RNConstants.ARG_MINDATE)) {
      args.putLong(RNConstants.ARG_MINDATE, (long) options.getDouble(RNConstants.ARG_MINDATE));
    }
    if (options.hasKey(RNConstants.ARG_MAXDATE) && !options.isNull(RNConstants.ARG_MAXDATE)) {
      args.putLong(RNConstants.ARG_MAXDATE, (long) options.getDouble(RNConstants.ARG_MAXDATE));
    }
    if (options.hasKey(RNConstants.ARG_DISPLAY) && !options.isNull(RNConstants.ARG_DISPLAY)) {
      args.putString(RNConstants.ARG_DISPLAY, options.getString(RNConstants.ARG_DISPLAY));
    }
    if (options.hasKey(RNConstants.ARG_DIALOG_BUTTONS) && !options.isNull(RNConstants.ARG_DIALOG_BUTTONS)) {
      args.putBundle(RNConstants.ARG_DIALOG_BUTTONS, Arguments.toBundle(options.getMap(RNConstants.ARG_DIALOG_BUTTONS)));
    }
    if (options.hasKey(RNConstants.ARG_TZOFFSET_MINS) && !options.isNull(RNConstants.ARG_TZOFFSET_MINS)) {
      args.putLong(RNConstants.ARG_TZOFFSET_MINS, (long) options.getDouble(RNConstants.ARG_TZOFFSET_MINS));
    }
    return args;
  }
}
