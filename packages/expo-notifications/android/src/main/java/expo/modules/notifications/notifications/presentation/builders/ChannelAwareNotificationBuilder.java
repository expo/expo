package expo.modules.notifications.notifications.presentation.builders;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;
import expo.modules.notifications.R;
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.model.NotificationRequest;

/**
 * A notification builder foundation capable of fetching and/or creating
 * a notification channel to which the notification request should be posted.
 */
public abstract class ChannelAwareNotificationBuilder extends BaseNotificationBuilder {
  private final static String FALLBACK_CHANNEL_ID = "expo_notifications_fallback_notification_channel";

  // Behaviors we will want to impose on received notifications include
  // being displayed as a heads-up notification. For that we will need
  // a channel of high importance.
  @RequiresApi(api = Build.VERSION_CODES.N)
  private final static int FALLBACK_CHANNEL_IMPORTANCE = NotificationManager.IMPORTANCE_HIGH;

  public ChannelAwareNotificationBuilder(Context context) {
    super(context);
  }

  protected NotificationCompat.Builder createBuilder() {
    return new NotificationCompat.Builder(getContext(), getChannelId());
  }

  /**
   * @return A {@link NotificationChannel}'s identifier to use for the notification.
   */
  protected String getChannelId() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      // Returning null on incompatible platforms won't be an error.
      return null;
    }

    NotificationTrigger trigger = getTrigger();
    if (trigger == null) {
      Log.e("notifications", String.format("Couldn't get channel for the notifications - trigger is 'null'. Fallback to '%s' channel", FALLBACK_CHANNEL_ID));
      return getFallbackNotificationChannel().getId();
    }

    String channelId = trigger.getNotificationChannel();
    if (channelId == null) {
      return getFallbackNotificationChannel().getId();
    }

    NotificationsChannelManager manager = getNotificationsChannelManager();
    NotificationChannel channel = manager.getNotificationChannel(channelId);
    if (channel == null) {
      Log.e("notifications", String.format("Channel '%s' doesn't exists. Fallback to '%s' channel", channelId, FALLBACK_CHANNEL_ID));
      return getFallbackNotificationChannel().getId();
    }

    return channel.getId();
  }

  @NonNull
  protected NotificationsChannelManager getNotificationsChannelManager() {
    return new AndroidXNotificationsChannelManager(getContext(), new AndroidXNotificationsChannelGroupManager(getContext()));
  }

  /**
   * Fetches the fallback notification channel, and if it doesn't exist yet - creates it.
   * <p>
   * Returns null on {@link NotificationChannel}-incompatible platforms.
   *
   * @return Fallback {@link NotificationChannel} or null.
   */
  public NotificationChannel getFallbackNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return null;
    }

    NotificationChannel channel = getNotificationManager().getNotificationChannel(FALLBACK_CHANNEL_ID);
    if (channel != null) {
      return channel;
    }

    return createFallbackChannel();
  }

  /**
   * Creates a fallback channel of {@link #FALLBACK_CHANNEL_ID} ID, name fetched
   * from Android resources ({@link #getFallbackChannelName()}
   * and importance set by {@link #FALLBACK_CHANNEL_IMPORTANCE}.
   *
   * @return Newly created channel.
   */
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected NotificationChannel createFallbackChannel() {
    NotificationChannel channel = new NotificationChannel(FALLBACK_CHANNEL_ID, getFallbackChannelName(), FALLBACK_CHANNEL_IMPORTANCE);
    channel.setShowBadge(true);
    channel.enableVibration(true);
    getNotificationManager().createNotificationChannel(channel);
    return channel;
  }

  /**
   * Fetches fallback channel name from Android resources. Overridable by Android resources system
   * or subclassing.
   *
   * @return Name of the fallback channel
   */
  protected String getFallbackChannelName() {
    return getContext().getString(R.string.expo_notifications_fallback_channel_name);
  }

  private NotificationManager getNotificationManager() {
    return (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
  }

  @Nullable
  private NotificationTrigger getTrigger() {
    NotificationRequest request = getNotification().getNotificationRequest();
    if (request == null) {
      return null;
    }

    return request.getTrigger();
  }
}
