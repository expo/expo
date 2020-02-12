package expo.modules.notifications.notifications.interfaces;

/**
 * Class representing behavior which should be applied
 * to a notification.
 */
public abstract class NotificationBehavior {
  /**
   * @return Whether to show a heads-up alert.
   */
  public abstract boolean shouldShowAlert();

  /**
   * @return Whether the notification should be accompanied by a sound.
   */
  public abstract boolean shouldPlaySound();

  /**
   * @return Whether badge count that may be contained in the notification should be applied.
   */
  public abstract boolean shouldSetBadge();

  /**
   * @return Whether the notification may have any user-facing effect.
   */
  public boolean hasAnyEffect() {
    return shouldShowAlert() || shouldPlaySound() || shouldSetBadge();
  }
}
