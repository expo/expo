package expo.modules.notifications.notifications.channels.serializers;

import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.os.Build;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public class ExpoNotificationsChannelGroupSerializer implements NotificationsChannelGroupSerializer {

  private NotificationsChannelSerializer mChannelSerializer;

  public ExpoNotificationsChannelGroupSerializer(NotificationsChannelSerializer channelSerializer) {
    mChannelSerializer = channelSerializer;
  }

  @Override
  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  public Bundle toBundle(@Nullable NotificationChannelGroup group) {
    if (group == null) {
      return null;
    }
    Bundle result = new Bundle();
    result.putString(ID_KEY, getId(group));
    result.putString(NAME_KEY, group.getName().toString());
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
      result.putString(DESCRIPTION_KEY, group.getDescription());
      result.putBoolean(IS_BLOCKED_KEY, group.isBlocked());
    }
    result.putParcelableArrayList(CHANNELS_KEY, toList(group.getChannels()));
    return result;
  }

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getId(@NonNull NotificationChannelGroup channel) {
    return channel.getId();
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  private ArrayList<Bundle> toList(List<NotificationChannel> channels) {
    ArrayList<Bundle> results = new ArrayList<>(channels.size());
    for (NotificationChannel channel : channels) {
      results.add(mChannelSerializer.toBundle(channel));
    }
    return results;
  }
}
