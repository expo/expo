package expo.modules.notifications.notifications;

import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.util.Log;

import org.json.JSONObject;
import expo.modules.core.arguments.ReadableArguments;

import java.util.List;
import java.util.Map;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.channels.InvalidVibrationPatternException;
import expo.modules.notifications.notifications.enums.NotificationPriority;
import expo.modules.notifications.notifications.model.NotificationContent;

public class ArgumentsNotificationContentBuilder extends NotificationContent.Builder {
  private static final String TITLE_KEY = "title";
  private static final String SUBTITLE_KEY = "subtitle";
  private static final String TEXT_KEY = "body";
  private static final String BODY_KEY = "data";
  private static final String SOUND_KEY = "sound";
  private static final String VIBRATE_KEY = "vibrate";
  private static final String PRIORITY_KEY = "priority";
  private static final String BADGE_KEY = "badge";
  private static final String COLOR_KEY = "color";
  private static final String AUTO_DISMISS_KEY = "autoDismiss";
  private static final String CATEGORY_IDENTIFIER_KEY = "categoryIdentifier";
  private static final String STICKY_KEY = "sticky";

  private SoundResolver mSoundResolver;

  public ArgumentsNotificationContentBuilder(Context context) {
    mSoundResolver = new SoundResolver(context);
  }

  public NotificationContent.Builder setPayload(ReadableArguments payload) {
    this.setTitle(payload.getString(TITLE_KEY))
      .setSubtitle(payload.getString(SUBTITLE_KEY))
      .setText(payload.getString(TEXT_KEY))
      .setBody(getBody(payload))
      .setPriority(getPriority(payload))
      .setBadgeCount(getBadgeCount(payload))
      .setColor(getColor(payload))
      .setAutoDismiss(getAutoDismiss(payload))
      .setCategoryId(getCategoryId(payload))
      .setSticky(getSticky(payload));

    if (shouldPlayDefaultSound(payload)) {
      useDefaultSound();
    } else {
      setSound(getSound(payload));
    }

    if (shouldUseDefaultVibrationPattern(payload)) {
      useDefaultVibrationPattern();
    } else {
      setVibrationPattern(getVibrationPattern(payload));
    }
    return this;
  }

  protected Number getBadgeCount(ReadableArguments payload) {
    return payload.containsKey(BADGE_KEY) ? payload.getInt(BADGE_KEY) : null;
  }

  protected Number getColor(ReadableArguments payload) {
    try {
      return payload.containsKey(COLOR_KEY) ? Color.parseColor(payload.getString(COLOR_KEY)) : null;
    } catch (IllegalArgumentException e) {
      Log.e("expo-notifications", "Could not have parsed color passed in notification.");
      return null;
    }
  }

  protected boolean shouldPlayDefaultSound(ReadableArguments payload) {
    if (payload.get(SOUND_KEY) instanceof Boolean) {
      return payload.getBoolean(SOUND_KEY);
    }

    // do not play a default sound only if the value is a valid Uri
    return getSound(payload) == null;
  }

  protected Uri getSound(ReadableArguments payload) {
    String soundValue = payload.getString(SOUND_KEY);
    return mSoundResolver.resolve(soundValue);
  }

  @Nullable
  protected JSONObject getBody(ReadableArguments payload) {
    try {
      Map body = payload.getMap(BODY_KEY);
      if (body != null) {
        return new JSONObject(body);
      }
      return null;
    } catch (NullPointerException e) {
      return null;
    }
  }

  protected boolean shouldUseDefaultVibrationPattern(ReadableArguments payload) {
    return !payload.getBoolean(VIBRATE_KEY, true);
  }

  protected long[] getVibrationPattern(ReadableArguments payload) {
    try {
      List<?> vibrateJsonArray = payload.getList(VIBRATE_KEY);
      if (vibrateJsonArray != null) {
        long[] pattern = new long[vibrateJsonArray.size()];
        for (int i = 0; i < vibrateJsonArray.size(); i++) {
          if (vibrateJsonArray.get(i) instanceof Number) {
            pattern[i] = ((Number) vibrateJsonArray.get(i)).longValue();
          } else {
            throw new InvalidVibrationPatternException(i, vibrateJsonArray.get(i));
          }
        }
        return pattern;
      }
    } catch (InvalidVibrationPatternException e) {
      Log.w("expo-notifications", "Failed to set custom vibration pattern from the notification: " + e.getMessage());
    }

    return null;
  }

  protected NotificationPriority getPriority(ReadableArguments payload) {
    String priorityString = payload.getString(PRIORITY_KEY);
    return NotificationPriority.fromEnumValue(priorityString);
  }

  protected boolean getAutoDismiss(ReadableArguments payload) {
    // TODO(sjchmiela): the default value should be determined by NotificationContent.Builder
    return payload.getBoolean(AUTO_DISMISS_KEY, true);
  }

  @Nullable
  protected String getCategoryId(ReadableArguments payload) {
    return payload.getString(CATEGORY_IDENTIFIER_KEY, null);
  }

  protected boolean getSticky(ReadableArguments payload) {
    // TODO: the default value should be determined by NotificationContent.Builder
    return payload.getBoolean(STICKY_KEY, false);
  }
}
