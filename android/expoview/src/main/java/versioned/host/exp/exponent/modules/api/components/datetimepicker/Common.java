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

import java.util.Locale;

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
	public static DialogInterface.OnShowListener setButtonTextColor(@NonNull Context activityContext, final AlertDialog dialog, final Bundle args, final boolean needsColorOverride) {
    return new DialogInterface.OnShowListener() {
      @Override
      public void onShow(DialogInterface dialogInterface) {
        // change text color only if custom color is set or if spinner mode is set
        // because spinner suffers from https://github.com/react-native-datetimepicker/datetimepicker/issues/543

        Button positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
        Button negativeButton = dialog.getButton(AlertDialog.BUTTON_NEGATIVE);
        Button neutralButton = dialog.getButton(AlertDialog.BUTTON_NEUTRAL);

        int textColorPrimary = getDefaultDialogButtonTextColor(activityContext);
        setTextColor(positiveButton, POSITIVE, args, needsColorOverride, textColorPrimary);
        setTextColor(negativeButton, NEGATIVE, args, needsColorOverride, textColorPrimary);
        setTextColor(neutralButton, NEUTRAL, args, needsColorOverride, textColorPrimary);
      }
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
}
