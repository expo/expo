package expo.modules.notifications.notifications.presentation.builders;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;

/**
 * {@link NotificationBuilder} interpreting a JSON request object.
 */
public class ExpoNotificationBuilder extends ChannelAwareNotificationBuilder {
  private static final String CONTENT_TITLE_KEY = "title";
  private static final String CONTENT_TEXT_KEY = "message";
  private static final String CONTENT_SUBTITLE_KEY = "subtitle";
  private static final String SOUND_KEY = "sound";
  private static final String BODY_KEY = "body";
  private static final String VIBRATE_KEY = "vibrate";
  private static final String PRIORITY_KEY = "priority";
  private static final String THUMBNAIL_URI_KEY = "thumbnailUri";

  private static final String EXTRAS_BODY_KEY = "body";

  private static final long[] NO_VIBRATE_PATTERN = new long[]{0, 0};

  public ExpoNotificationBuilder(Context context) {
    super(context);
  }

  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();
    builder.setSmallIcon(getContext().getApplicationInfo().icon);
    builder.setPriority(getPriority());

    // We're setting the content only if there is anything to set
    // otherwise the content title and text are displayed
    // as if they were empty strings.
    if (!getNotificationRequest().isNull(CONTENT_TITLE_KEY)) {
      builder.setContentTitle(getNotificationRequest().optString(CONTENT_TITLE_KEY));
    }
    if (!getNotificationRequest().isNull(CONTENT_TEXT_KEY)) {
      builder.setContentText(getNotificationRequest().optString(CONTENT_TEXT_KEY));
    }
    if (!getNotificationRequest().isNull(CONTENT_SUBTITLE_KEY)) {
      builder.setSubText(getNotificationRequest().optString(CONTENT_SUBTITLE_KEY));
    }

    if (shouldPlaySound()) {
      // Attach default notification sound to the NotificationCompat.Builder
      builder.setSound(Settings.System.DEFAULT_NOTIFICATION_URI);
    } else {
      // Remove any sound attached to the NotificationCompat.Builder
      builder.setSound(null);
    }

    if (shouldPlaySound() && shouldVibrate()) {
      builder.setDefaults(NotificationCompat.DEFAULT_ALL); // set sound, vibration and lights
    } else if (shouldVibrate()) {
      builder.setDefaults(NotificationCompat.DEFAULT_VIBRATE);
    } else if (shouldPlaySound()) {
      builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
    } else {
      // Remove any sound or vibration attached by notification options.
      builder.setDefaults(0);
      // Remove any vibration pattern attached to the builder by overriding
      // it with a no-vibrate pattern. It also doubles as a cue for the OS
      // that given high priority it should be displayed as a heads-up notification.
      builder.setVibrate(NO_VIBRATE_PATTERN);
    }

    long[] vibrationPatternOverride = getVibrationPatternOverride();
    if (shouldVibrate() && vibrationPatternOverride != null) {
      builder.setVibrate(vibrationPatternOverride);
    }

    // Add body - JSON data - to extras
    Bundle extras = builder.getExtras();
    extras.putString(EXTRAS_BODY_KEY, getNotificationRequest().optString(BODY_KEY));
    builder.setExtras(extras);

    if (!getNotificationRequest().isNull(THUMBNAIL_URI_KEY)) {
      Log.w("expo-notifications", "Fetching large icon is not supported on this platform at the moment.");
    }

    return builder;
  }

  @Override
  public Notification build() {
    return createBuilder().build();
  }

  /**
   * Notification should play a sound if and only if:
   * - behavior is not set or allows sound AND
   * - notification request doesn't explicitly set "sound" to false.
   * <p>
   * This way a notification can set "sound" to false to disable sound,
   * and we always honor the allowedBehavior, if set.
   *
   * @return Whether the notification should play a sound.
   */
  private boolean shouldPlaySound() {
    //                                                                         if SOUND_KEY is not an explicit false we fallback to true
    return (getNotificationBehavior() == null || getNotificationBehavior().shouldPlaySound()) && !getNotificationRequest().optBoolean(SOUND_KEY, true);
  }

  /**
   * Notification should vibrate if and only if:
   * - behavior is not set or allows sound AND
   * - notification request doesn't explicitly set "vibrate" to false.
   * <p>
   * This way a notification can set "vibrate" to false to disable vibration.
   *
   * @return Whether the notification should vibrate.
   */
  private boolean shouldVibrate() {
    //                                                                         if VIBRATE_KEY is not an explicit false we fallback to true
    return (getNotificationBehavior() == null || getNotificationBehavior().shouldPlaySound()) && !getNotificationRequest().optBoolean(VIBRATE_KEY, true);
  }

  /**
   * When setting the priority we want to honor both behavior set by the current
   * notification handler and the preset priority (in that order of significance).
   * <p>
   * We do this by returning:
   * - if behavior defines a priority: the priority,
   * - if the notification should be shown: high priority (or max, if requested in the notification),
   * - if the notification should not be shown: default priority (or lower, if requested in the notification).
   * <p>
   * This way we allow full customization to the developers.
   *
   * @return Priority of the notification, one of NotificationCompat.PRIORITY_*
   */
  private int getPriority() {
    Number requestPriorityNumber = getPriorityFromString(getNotificationRequest().optString(PRIORITY_KEY));

    // If we know of a behavior guideline, let's honor it...
    if (getNotificationBehavior() != null) {
      // ...by using the priority override...
      Number priorityOverride = getPriorityFromString(getNotificationBehavior().getPriorityOverride());
      if (priorityOverride != null) {
        return priorityOverride.intValue();
      }

      // ...or by setting min/max values for priority:
      // If the notification has no priority set, let's pick a neutral value and depend solely on the behavior.
      int requestPriority =
          requestPriorityNumber == null
              ? NotificationCompat.PRIORITY_DEFAULT
              : requestPriorityNumber.intValue();

      if (getNotificationBehavior().shouldShowAlert()) {
        // Display as a heads-up notification, as per the behavior
        // while also allowing making the priority higher.
        return Math.max(NotificationCompat.PRIORITY_HIGH, requestPriority);
      } else {
        // Do not display as a heads-up notification, but show in the notification tray
        // as per the behavior, while also allowing making the priority lower.
        return Math.min(NotificationCompat.PRIORITY_DEFAULT, requestPriority);
      }
    }

    // No behavior is set, the only source of priority can be the request.
    if (requestPriorityNumber != null) {
      return requestPriorityNumber.intValue();
    }

    // By default let's show the notification
    return NotificationCompat.PRIORITY_HIGH;
  }

  @Nullable
  protected Number getPriorityFromString(@Nullable String priorityString) {
    if (priorityString == null) {
      return null;
    }

    switch (priorityString) {
      case "max":
        return NotificationCompat.PRIORITY_MAX;
      case "high":
        return NotificationCompat.PRIORITY_HIGH;
      case "default":
        return NotificationCompat.PRIORITY_DEFAULT;
      case "low":
        return NotificationCompat.PRIORITY_LOW;
      case "min":
        return NotificationCompat.PRIORITY_MIN;
      case "":
        // A valid non-value
        return null;
      default:
        Log.w("expo-notifications", "Unrecognized priority requested: " + priorityString + ".");
        return null;
    }
  }

  private long[] getVibrationPatternOverride() {
    try {
      JSONArray vibrateJsonArray = getNotificationRequest().optJSONArray(VIBRATE_KEY);
      if (vibrateJsonArray != null) {
        long[] pattern = new long[vibrateJsonArray.length()];
        for (int i = 0; i < vibrateJsonArray.length(); i++) {
          pattern[i] = vibrateJsonArray.getLong(i);
        }
        return pattern;
      }
    } catch (JSONException e) {
      Log.w("expo-notifications", "Failed to set custom vibration pattern from the notification: " + e.getMessage());
    }

    return null;
  }
}
