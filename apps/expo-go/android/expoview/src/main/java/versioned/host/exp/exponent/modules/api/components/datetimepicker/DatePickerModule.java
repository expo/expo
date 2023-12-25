/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import android.app.DatePickerDialog.OnDateSetListener;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.content.DialogInterface.OnClickListener;
import android.os.Bundle;
import android.widget.DatePicker;
import androidx.annotation.NonNull;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import com.facebook.react.bridge.*;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;

import static versioned.host.exp.exponent.modules.api.components.datetimepicker.Common.dismissDialog;

import java.util.Calendar;

/**
 * {@link NativeModule} that allows JS to show a native date picker dialog and get called back when
 * the user selects a date.
 */
@ReactModule(name = DatePickerModule.NAME)
public class DatePickerModule extends NativeModuleDatePickerSpec {

  @VisibleForTesting
  public static final String NAME = "RNCDatePicker";

  public DatePickerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
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
        final RNDate date = new RNDate(mArgs);
        Calendar calendar = Calendar.getInstance(Common.getTimeZone(mArgs));
        calendar.set(year, month, day, date.hour(), date.minute(), 0);
        calendar.set(Calendar.MILLISECOND, 0);

        WritableMap result = new WritableNativeMap();
        result.putString("action", RNConstants.ACTION_DATE_SET);
        result.putDouble("timestamp", calendar.getTimeInMillis());
        result.putDouble("utcOffset", calendar.getTimeZone().getOffset(calendar.getTimeInMillis()) / 1000 / 60);

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
    dismissDialog(activity, NAME, promise);
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
   *   <li>
   *      {@code testID} testID for testing with e.g. detox.
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

    UiThreadUtil.runOnUiThread(() -> {
      RNDatePickerDialogFragment oldFragment =
              (RNDatePickerDialogFragment) fragmentManager.findFragmentByTag(NAME);

      Bundle arguments = createFragmentArguments(options);

      if (oldFragment != null) {
        oldFragment.update(arguments);
        return;
      }

      RNDatePickerDialogFragment fragment = new RNDatePickerDialogFragment();

      fragment.setArguments(arguments);

      final DatePickerDialogListener listener = new DatePickerDialogListener(promise, arguments);
      fragment.setOnDismissListener(listener);
      fragment.setOnDateSetListener(listener);
      fragment.setOnNeutralButtonActionListener(listener);
      fragment.show(fragmentManager, NAME);
    });
  }

  private Bundle createFragmentArguments(ReadableMap options) {
    final Bundle args = Common.createFragmentArguments(options);

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
    if (options.hasKey(RNConstants.ARG_TESTID) && !options.isNull(RNConstants.ARG_TESTID)) {
      args.putString(RNConstants.ARG_TESTID, options.getString(RNConstants.ARG_TESTID));
    }
    return args;
  }
}
