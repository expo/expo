package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import java.util.ArrayList;
import java.util.List;

import android.annotation.SuppressLint;
import android.app.TimePickerDialog;
import android.content.DialogInterface;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.util.Log;
import android.widget.TimePicker;
import android.view.View;
import android.widget.EditText;
import android.widget.NumberPicker;

class MinuteIntervalSnappableTimePickerDialog extends TimePickerDialog {
    private TimePicker mTimePicker;
    private int mTimePickerInterval;
    private RNTimePickerDisplay mDisplay;
    private final OnTimeSetListener mTimeSetListener;
    private Handler handler = new Handler();
    private Runnable runnable;
    private Context mContext;

    public MinuteIntervalSnappableTimePickerDialog(
            Context context,
            OnTimeSetListener listener,
            int hourOfDay,
            int minute,
            int minuteInterval,
            boolean is24HourView,
            RNTimePickerDisplay display
    ) {
        super(context, listener, hourOfDay, minute, is24HourView);
        mTimePickerInterval = minuteInterval;
        mTimeSetListener = listener;
        mDisplay = display;
        mContext = context;
    }

    public MinuteIntervalSnappableTimePickerDialog(
            Context context,
            int theme,
            OnTimeSetListener listener,
            int hourOfDay,
            int minute,
            int minuteInterval,
            boolean is24HourView,
            RNTimePickerDisplay display
    ) {
        super(context, theme, listener, hourOfDay, minute, is24HourView);
        mTimePickerInterval = minuteInterval;
        mTimeSetListener = listener;
        mDisplay = display;
        mContext = context;
    }

    public static boolean isValidMinuteInterval(int interval) {
      return interval >= 1 && interval <= 30 && 60 % interval == 0;
    }

    private boolean timePickerHasCustomMinuteInterval() {
        return mTimePickerInterval != RNConstants.DEFAULT_TIME_PICKER_INTERVAL;
    }

    private boolean isSpinner() {
        return mDisplay == RNTimePickerDisplay.SPINNER;
    }

    /**
     * Converts values returned from picker to actual minutes
     *
     * @param minutesOrSpinnerIndex the internal value of what the user had selected
     * @return returns 'real' minutes (0-59)
     */
    private int getRealMinutes(int minutesOrSpinnerIndex) {
        if (isSpinner()) {
            return minutesOrSpinnerIndex * mTimePickerInterval;
        }

        return minutesOrSpinnerIndex;
    }

    private int getRealMinutes() {
        int minute = mTimePicker.getCurrentMinute();
        return getRealMinutes(minute);
    }

    /**
     * 'Snaps' real minutes or spinner value index to nearest valid value
     * in spinner mode you need to make sure to transform the picked value (which is an index)
     * to a real value before passing!
     *
     * @param realMinutes 'real' minutes (0-59)
     * @return nearest valid real minute
     */
    private int snapRealMinutesToInterval(int realMinutes) {
        float stepsInMinutes = (float) realMinutes / (float) mTimePickerInterval;

        int rounded = Math.round(stepsInMinutes) * mTimePickerInterval;
        return rounded == 60 ? rounded - mTimePickerInterval : rounded;
    }

    private void assertNotSpinner(String s) {
        if (isSpinner()) {
            throw new RuntimeException(s);
        }
    }

    /**
     * Determines if picked real minutes are ok with the minuteInterval
     *
     * @param realMinutes 'real' minutes (0-59)
     */
    private boolean minutesNeedCorrection(int realMinutes) {
        assertNotSpinner("minutesNeedCorrection is not intended to be used with spinner, spinner won't allow picking invalid values");

        return timePickerHasCustomMinuteInterval() && realMinutes != snapRealMinutesToInterval(realMinutes);
    }

    /**
     * Determines if the picker is in text input mode (keyboard icon in 'clock' mode)
     */
    private boolean pickerIsInTextInputMode() {
        int textInputPickerId = mContext.getResources().getIdentifier("input_mode", "id", "android");
        final View textInputPicker = this.findViewById(textInputPickerId);

        return textInputPicker != null && textInputPicker.hasFocus();
    }

    /**
     * Corrects minute values if they don't align with minuteInterval
     * <p>
     * in text input mode, correction will be postponed slightly to let the user finish the input
     * in clock mode we also delay it to give user visual cue about the correction
     * <p>
     *
     * @param view        the picker's view
     * @param hourOfDay   the picker's selected hours
     * @param correctedMinutes 'real' minutes (0-59) aligned to minute interval
     */
    private void correctEnteredMinutes(final TimePicker view, final int hourOfDay, final int correctedMinutes) {
        assertNotSpinner("spinner never needs to be corrected because wrong values are not offered to user (both in scrolling and textInput mode)!");
        // 'correction' callback
        runnable = new Runnable() {
            @Override
            public void run() {
				if (pickerIsInTextInputMode()) {
					// only rewrite input when the value makes sense to be corrected
					// eg. given interval 3, when user wants to enter 53
					// we don't rewrite the first number "5" to 6, because it would be confusing
					// but the value will be corrected in onTimeChanged()
					// however, when they enter 10, we rewrite it to 9
					boolean canRewriteTextInput = correctedMinutes > 5;
					if (!canRewriteTextInput) {
						return;
					}
					fixTime();
					moveCursorToEnd();
				} else {
					fixTime();
				}
            }
			private void fixTime() {
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
					view.setHour(hourOfDay);
					view.setMinute(correctedMinutes);
				} else {
					view.setCurrentHour(hourOfDay);
					// we need to set minutes to 0 first for this to work on older android devices
					view.setCurrentMinute(0);
					view.setCurrentMinute(correctedMinutes);
				}
			}
			private void moveCursorToEnd() {
				View maybeTextInput = view.findFocus();
				if (maybeTextInput instanceof EditText) {
					final EditText textInput = (EditText) maybeTextInput;
					textInput.setSelection(textInput.getText().length());
				} else {
					Log.e("RN-datetimepicker", "could not set selection on time picker, this is a known issue on some Huawei devices");
				}
			}
        };

        handler.postDelayed(runnable, 500);
    }

    @Override
    public void onTimeChanged(final TimePicker view, final int hourOfDay, final int minute) {
        final int realMinutes = getRealMinutes(minute);
        // *always* remove pending 'validation' callbacks, otherwise a valid value might be rewritten
        handler.removeCallbacks(runnable);

        if (!isSpinner() && minutesNeedCorrection(realMinutes)) {
            int correctedMinutes = snapRealMinutesToInterval(realMinutes);

            // will fire another onTimeChanged
            correctEnteredMinutes(view, hourOfDay, correctedMinutes);
        } else {
            super.onTimeChanged(view, hourOfDay, minute);
        }
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
		boolean needsCustomHandling = timePickerHasCustomMinuteInterval() || isSpinner();
        if (mTimePicker != null && which == BUTTON_POSITIVE && needsCustomHandling) {
			mTimePicker.clearFocus();
			final int hours = mTimePicker.getCurrentHour();
			int realMinutes = getRealMinutes();
			int reportedMinutes = timePickerHasCustomMinuteInterval()
					? snapRealMinutesToInterval(realMinutes)
					: realMinutes;
			if (mTimeSetListener != null) {
				mTimeSetListener.onTimeSet(mTimePicker, hours, reportedMinutes);
			}
        } else {
            super.onClick(dialog, which);
        }
    }

    @Override
    public void updateTime(int hourOfDay, int minuteOfHour) {
        if (timePickerHasCustomMinuteInterval()) {
            if (isSpinner()) {
                final int realMinutes = getRealMinutes();
                int selectedIndex = snapRealMinutesToInterval(realMinutes) / mTimePickerInterval;
                super.updateTime(hourOfDay, selectedIndex);
            } else {
                super.updateTime(hourOfDay, snapRealMinutesToInterval(minuteOfHour));
            }
        } else {
            super.updateTime(hourOfDay, minuteOfHour);
        }
    }

    /**
     * Apply visual style in 'spinner' mode
     * Adjust minutes to correspond selected interval
     */
    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();

		int timePickerId = mContext.getResources().getIdentifier("timePicker", "id", "android");
		mTimePicker = this.findViewById(timePickerId);

        if (timePickerHasCustomMinuteInterval()) {
            setupPickerDialog();
        }
    }

    private void setupPickerDialog() {
		if (mTimePicker == null) {
			Log.e("RN-datetimepicker", "time picker was null");
			return;
		}
        int realMinuteBackup = mTimePicker.getCurrentMinute();

        if (isSpinner()) {
            setSpinnerDisplayedValues();
            int selectedIndex = snapRealMinutesToInterval(realMinuteBackup) / mTimePickerInterval;
            mTimePicker.setCurrentMinute(selectedIndex);
        } else {
            int snappedRealMinute = snapRealMinutesToInterval(realMinuteBackup);
            mTimePicker.setCurrentMinute(snappedRealMinute);
        }
    }

    @SuppressLint("DefaultLocale")
    private void setSpinnerDisplayedValues() {
        int minutePickerId = mContext.getResources().getIdentifier("minute", "id", "android");
        NumberPicker minutePicker = this.findViewById(minutePickerId);

        minutePicker.setMinValue(0);
        minutePicker.setMaxValue((60 / mTimePickerInterval) - 1);

        List<String> displayedValues = new ArrayList<>(60 / mTimePickerInterval);
        for (int displayedMinute = 0; displayedMinute < 60; displayedMinute += mTimePickerInterval) {
            displayedValues.add(String.format("%02d", displayedMinute));
        }

        minutePicker.setDisplayedValues(displayedValues.toArray(new String[0]));
    }

    @Override
    public void onDetachedFromWindow() {
        handler.removeCallbacks(runnable);
        super.onDetachedFromWindow();
    }
}
