package expo.modules.notifications.notifications.presentation.builders;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;
import android.provider.Settings;

import androidx.core.app.NotificationCompat;
import expo.modules.notifications.notifications.enums.NotificationPriority;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.model.NotificationContent;

import static expo.modules.notifications.notifications.model.NotificationResponse.DEFAULT_ACTION_IDENTIFIER;
import static expo.modules.notifications.notifications.service.NotificationResponseReceiver.getActionIntent;

/**
 * {@link NotificationBuilder} interpreting a JSON request object.
 */
public class ExpoNotificationBuilder extends ChannelAwareNotificationBuilder {
  private static final String EXTRAS_BODY_KEY = "body";

  private static final long[] NO_VIBRATE_PATTERN = new long[]{0, 0};

  public ExpoNotificationBuilder(Context context) {
    super(context);
  }

  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();
    builder.setSmallIcon(getContext().getApplicationInfo().icon);
    builder.setPriority(getPriority());

    NotificationContent content = getNotificationContent();

    builder.setContentTitle(content.getTitle());
    builder.setContentText(content.getText());
    builder.setSubText(content.getSubtitle());

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

    if (shouldPlaySound() && content.getSound() != null) {
      builder.setSound(content.getSound());
    } else if (shouldPlaySound() && content.shouldPlayDefaultSound()) {
      builder.setSound(Settings.System.DEFAULT_NOTIFICATION_URI);
    }

    long[] vibrationPatternOverride = content.getVibrationPattern();
    if (shouldVibrate() && vibrationPatternOverride != null) {
      builder.setVibrate(vibrationPatternOverride);
    }

    if (content.getBody() != null) {
      // Add body - JSON data - to extras
      Bundle extras = builder.getExtras();
      extras.putString(EXTRAS_BODY_KEY, content.getBody().toString());
      builder.setExtras(extras);
    }

    builder.setContentIntent(getActionIntent(getContext(), DEFAULT_ACTION_IDENTIFIER, getNotification()));

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
    boolean behaviorAllowsSound = getNotificationBehavior() == null || getNotificationBehavior().shouldPlaySound();

    NotificationContent content = getNotificationContent();
    boolean contentAllowsSound = content.shouldPlayDefaultSound() || content.getSound() != null;

    return behaviorAllowsSound && contentAllowsSound;
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
    boolean behaviorAllowsVibration = getNotificationBehavior() == null || getNotificationBehavior().shouldPlaySound();

    NotificationContent content = getNotificationContent();
    boolean contentAllowsVibration = content.shouldUseDefaultVibrationPattern() || content.getVibrationPattern() != null;

    return behaviorAllowsVibration && contentAllowsVibration;
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
    NotificationPriority requestPriority = getNotificationContent().getPriority();

    // If we know of a behavior guideline, let's honor it...
    if (getNotificationBehavior() != null) {
      // ...by using the priority override...
      NotificationPriority priorityOverride = getNotificationBehavior().getPriorityOverride();
      if (priorityOverride != null) {
        return priorityOverride.getNativeValue();
      }

      // ...or by setting min/max values for priority:
      // If the notification has no priority set, let's pick a neutral value and depend solely on the behavior.
      int requestPriorityValue =
          requestPriority != null
              ? requestPriority.getNativeValue()
              : NotificationPriority.DEFAULT.getNativeValue();

      if (getNotificationBehavior().shouldShowAlert()) {
        // Display as a heads-up notification, as per the behavior
        // while also allowing making the priority higher.
        return Math.max(NotificationCompat.PRIORITY_HIGH, requestPriorityValue);
      } else {
        // Do not display as a heads-up notification, but show in the notification tray
        // as per the behavior, while also allowing making the priority lower.
        return Math.min(NotificationCompat.PRIORITY_DEFAULT, requestPriorityValue);
      }
    }

    // No behavior is set, the only source of priority can be the request.
    if (requestPriority != null) {
      return requestPriority.getNativeValue();
    }

    // By default let's show the notification
    return NotificationCompat.PRIORITY_HIGH;
  }
}
