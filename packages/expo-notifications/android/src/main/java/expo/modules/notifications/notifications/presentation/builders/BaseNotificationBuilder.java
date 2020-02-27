package expo.modules.notifications.notifications.presentation.builders;

import android.content.Context;

import org.json.JSONObject;

import expo.modules.notifications.notifications.interfaces.NotificationBehavior;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;

/**
 * A foundation class for {@link NotificationBuilder} implementations. Takes care
 * of accepting {@link #mNotificationRequest} and {@link #mNotificationBehavior}.
 */
public abstract class BaseNotificationBuilder implements NotificationBuilder {
  private JSONObject mNotificationRequest;
  private NotificationBehavior mNotificationBehavior;
  private Context mContext;

  protected BaseNotificationBuilder(Context context) {
    mContext = context;
  }

  @Override
  public NotificationBuilder setNotificationRequest(JSONObject notificationRequest) {
    mNotificationRequest = notificationRequest;
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

  protected JSONObject getNotificationRequest() {
    return mNotificationRequest;
  }

  protected NotificationBehavior getNotificationBehavior() {
    return mNotificationBehavior;
  }
}
