package expo.modules.notifications.channels;

import android.content.Context;

import java.util.concurrent.Future;

public interface ChannelManager {

  void addChannel(String channelId, ChannelPOJO channel, final Context context);

  void deleteChannel(String channelId, final Context context);

  default void addChannel(String channelId, ChannelPOJO channel, final Context context, Runnable continuation) {
    addChannel(channelId, channel, context);
  }

  default void deleteChannel(String channelId, final Context context, Runnable continuation) {
    deleteChannel(channelId, context);
  }

  Future<ChannelPOJO> getPropertiesForChannelId(String channelId, final Context context);

}
