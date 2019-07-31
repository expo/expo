package host.exp.exponent.notifications.channels;

import android.content.Context;

import java.util.concurrent.Future;

public interface ChannelManager {

  void addChannel(String channelId, ChannelPOJO channel, final Context context);

  void deleteChannel(String channelId, final Context context);

  Future<ChannelPOJO> getPropertiesForChannelId(String channelId, final Context context);

}
