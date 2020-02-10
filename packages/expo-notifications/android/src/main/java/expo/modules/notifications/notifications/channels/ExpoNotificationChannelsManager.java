package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import org.unimodules.core.interfaces.SingletonModule;

import androidx.annotation.RequiresApi;
import expo.modules.notifications.R;
import expo.modules.notifications.notifications.interfaces.NotificationChannelsManager;

/**
 * A singleton module implementing {@link NotificationChannelsManager} interface.
 */
public class ExpoNotificationChannelsManager implements SingletonModule, NotificationChannelsManager {
  private final static String SINGLETON_NAME = "NotificationChannelsManager";

  private final static String FALLBACK_CHANNEL_ID = "expo_notifications_fallback_notification_channel";

  // Behaviors we will want to impose on received notifications include
  // being displayed as a heads-up notification. For that we will need
  // a channel of high importance.
  @RequiresApi(api = Build.VERSION_CODES.N)
  private final static int FALLBACK_CHANNEL_IMPORTANCE = NotificationManager.IMPORTANCE_HIGH;

  private Context mContext;

  public ExpoNotificationChannelsManager(Context context) {
    mContext = context;
  }

  @Override
  public String getName() {
    return SINGLETON_NAME;
  }

  /**
   * Fetches the fallback notification channel, and if it doesn't exist yet - creates it.
   * <p>
   * Returns null on {@link NotificationChannel}-incompatible platforms.
   *
   * @return Fallback {@link NotificationChannel} or null.
   */
  @Override
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
    return mContext.getString(R.string.expo_notifications_fallback_channel_name);
  }

  private NotificationManager getNotificationManager() {
    return (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
  }
}
