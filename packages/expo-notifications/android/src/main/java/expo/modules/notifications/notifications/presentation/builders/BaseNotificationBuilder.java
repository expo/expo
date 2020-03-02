package expo.modules.notifications.notifications.presentation.builders;

import android.content.Context;

import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationContent;

/**
 * A foundation class for {@link NotificationBuilder} implementations. Takes care
 * of accepting {@link #mNotificationContent} and {@link #mNotificationBehavior}.
 */
public abstract class BaseNotificationBuilder implements NotificationBuilder {
  private NotificationContent mNotificationContent;
  private NotificationBehavior mNotificationBehavior;
  private Context mContext;

  protected BaseNotificationBuilder(Context context) {
    mContext = context;
  }

  @Override
  public NotificationBuilder setNotificationContent(NotificationContent notificationContent) {
    mNotificationContent = notificationContent;
    return this;
  }

  @Override
  public NotificationBuilder setAllowedBehavior(NotificationBehavior behavior) {
    mNotificationBehavior = behavior;
    return this;
  }

  protected Context getContext() {
    return mContext;
  }

  protected NotificationContent getNotificationContent() {
    return mNotificationContent;
  }

  protected NotificationBehavior getNotificationBehavior() {
    return mNotificationBehavior;
  }
}
