package expo.modules.notifications.channels;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

public class AndroidAwareChannelManager  implements ChannelManager {

  ChannelManager nextChannelManager = new PersistentChannelManager();

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, final Context context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel newChannel = new NotificationChannel(channelId, channel.getChannelName(), channel.getImportance());

      if (channel.getGroupId() != null) {
        newChannel.setGroup(channel.getGroupId());
      }

      if (channel.getDescription() != null) {
        newChannel.setDescription(channel.getDescription());
      }

      newChannel.setVibrationPattern(channel.getVibrate());

      if (!channel.getSound()) {
        newChannel.setSound(null, null);
      }

      newChannel.setShowBadge(channel.getBadge());
      NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(newChannel);
    } else {
      nextChannelManager.addChannel(channelId, channel, context);
    }
  }

  @Override
  public void deleteChannel(String channelId, final Context context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      nextChannelManager.deleteChannel(channelId, context);
    }
  }

  @Override
  public Future<ChannelPOJO> getPropertiesForChannelId(String channelId, final Context context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Future<ChannelPOJO> channelPOJOFuture = nextChannelManager.getPropertiesForChannelId(channelId, context);

      try {
        if (channelPOJOFuture.get() != null) {
          ChannelPOJO channelFromDB = channelPOJOFuture.get();
          nextChannelManager.deleteChannel(channelId, context);
          addChannel(channelId, channelFromDB, context);
          return new SynchronicFuture(channelFromDB);
        }
      } catch (ExecutionException | InterruptedException e) {
        e.printStackTrace();
      }

      return getPropertiesFromSystem(channelId, context);
    } else {
      return nextChannelManager.getPropertiesForChannelId(channelId, context);
    }
  }

  private Future<ChannelPOJO> getPropertiesFromSystem(String channelId, Context context) {
    NotificationManager notificationManager =
        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    NotificationChannel notificationChannel = notificationManager.getNotificationChannel(channelId);
    if (notificationChannel == null) {
      return new SynchronicFuture(null);
    }

    ChannelPOJO.Builder builder = new ChannelPOJO.Builder();

    ChannelPOJO channelPOJO = builder.setChannelId(channelId)
        .setChannelName(notificationChannel.getName().toString())
        .setDescription(notificationChannel.getDescription())
        .setGroupId(notificationChannel.getGroup())
        .setVibrate(notificationChannel.getVibrationPattern())
        .setSound(notificationChannel.getSound() != null)
        .setBadge(notificationChannel.canShowBadge())
        .setImportance(Math.max(1,notificationChannel.getImportance()))
        .build();

    return new SynchronicFuture(channelPOJO);
  }
}
