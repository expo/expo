package host.exp.exponent.notifications.channels;

import java.util.concurrent.Future;

public interface ChannelManager {
  void addChannel(String channelId, ChannelProperties channelProperties);
  void deleteChannel(String channelId);
  Future<ChannelProperties> getPropertiesForChannelId(String channelId);
}
