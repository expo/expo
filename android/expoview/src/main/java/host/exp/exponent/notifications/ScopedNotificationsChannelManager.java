package host.exp.exponent.notifications;

import android.app.NotificationChannel;
import android.content.Context;
import android.os.Build;

import org.unimodules.core.arguments.ReadableArguments;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.SoundResolver;
import expo.modules.notifications.notifications.channels.manager.AndroidXNotificationsChannelManager;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsChannelManager extends AndroidXNotificationsChannelManager {
  private static final String SCOPED_CHANNEL_TAG = "EXPOCHANNEL";
  private static final String CHANNEL_SEPARATOR = "/";
  private ExperienceId mExperienceId;

  public ScopedNotificationsChannelManager(Context context, SoundResolver soundResolver, ExperienceId experienceId) {
    super(context, soundResolver);
    mExperienceId = experienceId;
  }

  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannel getNotificationChannel(@NonNull String channelId) {
    NotificationChannel scopedChannel = super.getNotificationChannel(scopeChannelId(channelId));
    if (scopedChannel != null) {
      return scopedChannel;
    }

    // In SDK 38 channels weren't scoped, so we want to return unscoped channel if the scoped one wasn't found.
    return super.getNotificationChannel(channelId);
  }

  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public List<NotificationChannel> getNotificationChannels() {
    ArrayList<NotificationChannel> result = new ArrayList<>();
    List<NotificationChannel> notificationChannels = super.getNotificationChannels();
    for (NotificationChannel channel : notificationChannels) {
      if (checkIfChannelBelongsToExperience(channel)) {
        result.add(channel);
      }
    }

    return result;
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public void deleteNotificationChannel(@NonNull String channelId) {
    NotificationChannel channel = getNotificationChannel(channelId);
    if (channel != null) {
      super.deleteNotificationChannel(channel.getId());
    }
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannel createNotificationChannel(@NonNull String channelId, CharSequence name, int importance, ReadableArguments channelOptions) {
    return super.createNotificationChannel(scopeChannelId(channelId), name, importance, channelOptions);
  }

  @NonNull
  private String scopeChannelId(@NonNull String channelId) {
    return String.format("%s%s%s%s%s", SCOPED_CHANNEL_TAG, CHANNEL_SEPARATOR, mExperienceId.get(), CHANNEL_SEPARATOR, channelId);
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  private boolean checkIfChannelBelongsToExperience(@NonNull NotificationChannel channel) {
    // Backward compatibility with unscoped channels.
    if (!channel.getId().startsWith(SCOPED_CHANNEL_TAG)) {
      return true;
    }

    // Channel id looks like this: `EXPOCHANNEL/@expo/sandbox/channel-id`.
    String[] idFragments = channel.getId().split(CHANNEL_SEPARATOR);
    String experienceIdFromChannel = String.format("%s%s%s", idFragments[1], CHANNEL_SEPARATOR, idFragments[2]);
    return channel.getId().equals(experienceIdFromChannel);
  }
}
