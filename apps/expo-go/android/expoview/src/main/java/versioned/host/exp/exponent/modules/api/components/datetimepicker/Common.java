package versioned.host.exp.exponent.modules.api.components.datetimepicker;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.res.Resources;
import android.graphics.Color;
import android.os.Bundle;
import android.util.TypedValue;
import android.widget.Button;

import androidx.annotation.ColorInt;
import androidx.annotation.ColorRes;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.util.RNLog;

import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.SimpleTimeZone;
import java.util.TimeZone;

public class Common {

  public static final String POSITIVE = "positive";
  public static final String NEUTRAL = "neutral";
  public static final String NEGATIVE = "negative";
  public static final String LABEL = "label";
  public static final String TEXT_COLOR = "textColor";

  public static void dismissDialog(FragmentActivity activity, String fragmentTag, Promise promise) {
    if (activity == null) {
      promise.reject(
              RNConstants.ERROR_NO_ACTIVITY,
              "Tried to close a " + fragmentTag + " dialog while not attached to an Activity");
      return;
    }

    try {
      FragmentManager fragmentManager = activity.getSupportFragmentManager();
      final DialogFragment oldFragment = (DialogFragment) fragmentManager.findFragmentByTag(fragmentTag);

      boolean fragmentFound = oldFragment != null;
      if (fragmentFound) {
        oldFragment.dismiss();
      }

      promise.resolve(fragmentFound);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

	public static int getDefaultDialogButtonTextColor(@NonNull Context activity) {
		TypedValue typedValue = new TypedValue();
		Resources.Theme theme = activity.getTheme();
		theme.resolveAttribute(android.R.attr.textColorPrimary, typedValue, true);
		@ColorRes int colorRes = (typedValue.resourceId != 0) ? typedValue.resourceId : typedValue.data;
		@ColorInt int colorId = ContextCompat.getColor(activity, colorRes);
		return colorId;
	}

	@NonNull
	public static DialogInterface.OnShowListener setButtonTextColor(@NonNull final Context activityContext, final AlertDialog dialog, final Bundle args, final boolean needsColorOverride) {
    return dialogInterface -> {
      // change text color only if custom color is set or if spinner mode is set
      // because spinner suffers from https://github.com/react-native-datetimepicker/datetimepicker/issues/543

      Button positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
      Button negativeButton = dialog.getButton(AlertDialog.BUTTON_NEGATIVE);
      Button neutralButton = dialog.getButton(AlertDialog.BUTTON_NEUTRAL);

      int textColorPrimary = getDefaultDialogButtonTextColor(activityContext);
      setTextColor(positiveButton, POSITIVE, args, needsColorOverride, textColorPrimary);
      setTextColor(negativeButton, NEGATIVE, args, needsColorOverride, textColorPrimary);
      setTextColor(neutralButton, NEUTRAL, args, needsColorOverride, textColorPrimary);
    };
	}

  private static void setTextColor(Button button, String buttonKey, final Bundle args, final boolean needsColorOverride, int textColorPrimary) {
    if (button == null) return;

    Integer color = getButtonColor(args, buttonKey);
    if (needsColorOverride || color != null) {
      button.setTextColor(color != null ? color : textColorPrimary);
    }
  }

  private static Integer getButtonColor(final Bundle args, String buttonKey) {
    Bundle buttons = args.getBundle(RNConstants.ARG_DIALOG_BUTTONS);
    if (buttons == null) {
      return null;
    }
    Bundle buttonParams = buttons.getBundle(buttonKey);
    if (buttonParams == null) {
      return null;
    }
    // yes, this cast is safe. the color is passed as int from JS (RN.processColor)
    int color = (int) buttonParams.getDouble(TEXT_COLOR, Color.TRANSPARENT);
    if (color == Color.TRANSPARENT) {
      return null;
    }
    return color;
  }

  public static RNTimePickerDisplay getDisplayTime(Bundle args) {
    RNTimePickerDisplay display = RNTimePickerDisplay.DEFAULT;
    if (args != null && args.getString(RNConstants.ARG_DISPLAY, null) != null) {
      display = RNTimePickerDisplay.valueOf(args.getString(RNConstants.ARG_DISPLAY).toUpperCase(Locale.US));
    }
    return display;
  }

  public static RNDatePickerDisplay getDisplayDate(Bundle args) {
    RNDatePickerDisplay display = RNDatePickerDisplay.DEFAULT;
    if (args != null && args.getString(RNConstants.ARG_DISPLAY, null) != null) {
      display = RNDatePickerDisplay.valueOf(args.getString(RNConstants.ARG_DISPLAY).toUpperCase(Locale.US));
    }
    return display;
  }

  public static void setButtonTitles(@NonNull Bundle args, AlertDialog dialog, DialogInterface.OnClickListener onNeutralButtonActionListener) {
    Bundle buttons = args.getBundle(RNConstants.ARG_DIALOG_BUTTONS);
    if (buttons == null) {
      return;
    }
    setButtonLabel(buttons.getBundle(NEUTRAL), dialog, AlertDialog.BUTTON_NEUTRAL, onNeutralButtonActionListener);
    setButtonLabel(buttons.getBundle(POSITIVE), dialog, AlertDialog.BUTTON_POSITIVE, (DialogInterface.OnClickListener) dialog);
    setButtonLabel(buttons.getBundle(NEGATIVE), dialog, AlertDialog.BUTTON_NEGATIVE, (DialogInterface.OnClickListener) dialog);
  }

  private static void setButtonLabel(Bundle buttonConfig, AlertDialog dialog, int whichButton, DialogInterface.OnClickListener listener) {
    if (buttonConfig == null || buttonConfig.getString(LABEL) == null) {
      return;
    }
    dialog.setButton(whichButton, buttonConfig.getString(LABEL), listener);
  }

  public static TimeZone getTimeZone(Bundle args) {
    if (args != null && args.containsKey(RNConstants.ARG_TZOFFSET_MINS)) {
      return new SimpleTimeZone((int)args.getLong(RNConstants.ARG_TZOFFSET_MINS) * 60 * 1000, "GMT");
    }

    if (args != null && args.containsKey(RNConstants.ARG_TZ_NAME)) {
      String timeZoneName = args.getString(RNConstants.ARG_TZ_NAME);
      if ("GMT".equals(timeZoneName)) {
        return TimeZone.getTimeZone("GMT");
      } else if (!"GMT".equals(TimeZone.getTimeZone(timeZoneName).getID())) {
        return TimeZone.getTimeZone(timeZoneName);
      }
      RNLog.w(null, "'" + timeZoneName + "' does not exist in TimeZone.getAvailableIDs(). Falling back to TimeZone.getDefault()=" + TimeZone.getDefault().getID());
    }

    return TimeZone.getDefault();
  }

  public static long maxDateWithTimeZone(Bundle args) {
    if (!args.containsKey(RNConstants.ARG_MAXDATE)) {
      return Long.MAX_VALUE;
    }

    Calendar maxDate = Calendar.getInstance(getTimeZone(args));
    maxDate.setTimeInMillis(args.getLong(RNConstants.ARG_MAXDATE));
    maxDate.set(Calendar.HOUR_OF_DAY, 23);
    maxDate.set(Calendar.MINUTE, 59);
    maxDate.set(Calendar.SECOND, 59);
    maxDate.set(Calendar.MILLISECOND, 999);
    return maxDate.getTimeInMillis();
  }

  public static long minDateWithTimeZone(Bundle args) {
    if (!args.containsKey(RNConstants.ARG_MINDATE)) {
      return 0;
    }

    Calendar minDate = Calendar.getInstance(getTimeZone(args));
    minDate.setTimeInMillis(args.getLong(RNConstants.ARG_MINDATE));
    minDate.set(Calendar.HOUR_OF_DAY, 0);
    minDate.set(Calendar.MINUTE, 0);
    minDate.set(Calendar.SECOND, 0);
    minDate.set(Calendar.MILLISECOND, 0);
    return minDate.getTimeInMillis();
  }

  public static Bundle createFragmentArguments(ReadableMap options) {
    final Bundle args = new Bundle();

    if (options.hasKey(RNConstants.ARG_VALUE) && !options.isNull(RNConstants.ARG_VALUE)) {
      args.putLong(RNConstants.ARG_VALUE, (long) options.getDouble(RNConstants.ARG_VALUE));
    }
    if (options.hasKey(RNConstants.ARG_TZ_NAME) && !options.isNull(RNConstants.ARG_TZ_NAME)) {
      args.putString(RNConstants.ARG_TZ_NAME, options.getString(RNConstants.ARG_TZ_NAME));
    }

    return args;
  }
}
