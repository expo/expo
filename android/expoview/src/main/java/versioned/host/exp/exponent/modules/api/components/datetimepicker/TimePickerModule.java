/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * </p>
 */

package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import com.facebook.react.bridge.*;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;

import android.app.TimePickerDialog.OnTimeSetListener;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.content.DialogInterface.OnClickListener;
import android.os.Bundle;
import android.widget.TimePicker;

import androidx.annotation.NonNull;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import static versioned.host.exp.exponent.modules.api.components.datetimepicker.Common.dismissDialog;

/**
 * {@link NativeModule} that allows JS to show a native time picker dialog and get called back when
 * the user selects a time.
 */
@ReactModule(name = TimePickerModule.NAME)
public class TimePickerModule extends NativeModuleTimePickerSpec {

  @VisibleForTesting
  public static final String NAME = "RNTimePicker";

  public TimePickerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  private class TimePickerDialogListener implements OnTimeSetListener, OnDismissListener, OnClickListener {
    private final Promise mPromise;
    private boolean mPromiseResolved = false;

    public TimePickerDialogListener(Promise promise) {
      mPromise = promise;
    }

    @Override
    public void onTimeSet(TimePicker view, int hour, int minute) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveReactInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", RNConstants.ACTION_TIME_SET);
        result.putInt("hour", hour);
        result.putInt("minute", minute);
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

  @ReactMethod
  public void open(final ReadableMap options, final Promise promise) {
    FragmentActivity activity = (FragmentActivity) getCurrentActivity();
    if (activity == null) {
      promise.reject(
              RNConstants.ERROR_NO_ACTIVITY,
              "Tried to open a TimePicker dialog while not attached to an Activity");
      return;
    }
    // We want to support both android.app.Activity and the pre-Honeycomb FragmentActivity
    // (for apps that use it for legacy reasons). This unfortunately leads to some code duplication.
    final FragmentManager fragmentManager = activity.getSupportFragmentManager();

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        RNTimePickerDialogFragment oldFragment =
                (RNTimePickerDialogFragment) fragmentManager.findFragmentByTag(NAME);

        if (oldFragment != null) {
          oldFragment.update(createFragmentArguments(options));
          return;
        }

        RNTimePickerDialogFragment fragment = new RNTimePickerDialogFragment();

        fragment.setArguments(createFragmentArguments(options));

        final TimePickerDialogListener listener = new TimePickerDialogListener(promise);
        fragment.setOnDismissListener(listener);
        fragment.setOnTimeSetListener(listener);
        fragment.setOnNeutralButtonActionListener(listener);
        fragment.show(fragmentManager, NAME);
      }
    });
  }

  private Bundle createFragmentArguments(ReadableMap options) {
    final Bundle args = new Bundle();
    if (options.hasKey(RNConstants.ARG_VALUE) && !options.isNull(RNConstants.ARG_VALUE)) {
      args.putLong(RNConstants.ARG_VALUE, (long) options.getDouble(RNConstants.ARG_VALUE));
    }
    if (options.hasKey(RNConstants.ARG_IS24HOUR) && !options.isNull(RNConstants.ARG_IS24HOUR)) {
      args.putBoolean(RNConstants.ARG_IS24HOUR, options.getBoolean(RNConstants.ARG_IS24HOUR));
    }
    if (options.hasKey(RNConstants.ARG_DISPLAY) && !options.isNull(RNConstants.ARG_DISPLAY)) {
      args.putString(RNConstants.ARG_DISPLAY, options.getString(RNConstants.ARG_DISPLAY));
    }
    if (options.hasKey(RNConstants.ARG_DIALOG_BUTTONS) && !options.isNull(RNConstants.ARG_DIALOG_BUTTONS)) {
      args.putBundle(RNConstants.ARG_DIALOG_BUTTONS, Arguments.toBundle(options.getMap(RNConstants.ARG_DIALOG_BUTTONS)));
    }
    if (options.hasKey(RNConstants.ARG_INTERVAL) && !options.isNull(RNConstants.ARG_INTERVAL)) {
      args.putInt(RNConstants.ARG_INTERVAL, options.getInt(RNConstants.ARG_INTERVAL));
    }
    if (options.hasKey(RNConstants.ARG_TZOFFSET_MINS) && !options.isNull(RNConstants.ARG_TZOFFSET_MINS)) {
      args.putInt(RNConstants.ARG_TZOFFSET_MINS, options.getInt(RNConstants.ARG_TZOFFSET_MINS));
    }
    return args;
  }
}
