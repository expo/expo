package expo.modules.notifications.notifications.handling;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import expo.modules.notifications.notifications.interfaces.NotificationBehavior;

/**
 * An implementation of {@link NotificationBehavior} capable of
 * "deserialization" of behavior objects with which the app responds.
 * <p>
 * Used in {@link NotificationsHandler#handleNotificationAsync(String, ReadableArguments, Promise)}
 * to pass the behavior to {@link SingleNotificationHandlerTask}.
 */
public class ExpoNotificationBehavior extends NotificationBehavior {
  private static final String SHOULD_SHOW_ALERT_KEY = "shouldShowAlert";
  private static final String SHOULD_PLAY_SOUND_KEY = "shouldPlaySound";
  private static final String SHOULD_SET_BADGE_KEY = "shouldSetBadge";
  private static final String PRIORITY_KEY = "priority";

  private ReadableArguments mArguments;

  ExpoNotificationBehavior(ReadableArguments arguments) {
    mArguments = arguments;
  }

  @Override
  public boolean shouldShowAlert() {
    return mArguments.getBoolean(SHOULD_SHOW_ALERT_KEY);
  }

  @Override
  public boolean shouldPlaySound() {
    return mArguments.getBoolean(SHOULD_PLAY_SOUND_KEY);
  }

  @Override
  public boolean shouldSetBadge() {
    return mArguments.getBoolean(SHOULD_SET_BADGE_KEY);
  }

  @Override
  public String getPriorityOverride() {
    return mArguments.getString(PRIORITY_KEY);
  }
}
