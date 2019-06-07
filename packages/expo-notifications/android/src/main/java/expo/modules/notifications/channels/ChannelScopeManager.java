package expo.modules.notifications.channels;

import android.content.Context;

import java.util.concurrent.Future;

import expo.modules.notifications.helpers.scoper.StringScoper;

public class ChannelScopeManager implements ChannelManager {

  private StringScoper mStringScoper = null;

  ChannelManager nextChannelManager = ThreadSafeChannelManager.getInstance();

  public ChannelScopeManager(StringScoper stringScoper) {
    mStringScoper = stringScoper;
  }

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, Context context) {
    addChannel(channelId, channel, context, () -> {});
  }

  @Override
  public void deleteChannel(String channelId, Context context) {
    deleteChannel(channelId, context, () -> {});
  }

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, Context context, Runnable continuation) {
    channelId = scope(channelId);
    channel = scope(channel);
    nextChannelManager.addChannel(channelId, channel, context, continuation);
  }

  @Override
  public void deleteChannel(String channelId, Context context, Runnable continuation) {
    channelId = scope(channelId);
    nextChannelManager.deleteChannel(channelId, context, continuation);
  }

  @Override
  public Future<ChannelPOJO> getPropertiesForChannelId(String channelId, Context context) {
    channelId = scope(channelId);
    return nextChannelManager.getPropertiesForChannelId(channelId, context);
  }

  private String scope(String text) {
    return mStringScoper.getScopedString(text);
  }

  private ChannelPOJO scope(ChannelPOJO channelPOJO) {
    ChannelPOJO.Builder builder = new ChannelPOJO.Builder();
    return builder.setImportance(channelPOJO.getImportance())
        .setBadge(channelPOJO.getBadge())
        .setSound(channelPOJO.getSound())
        .setVibrate(channelPOJO.getVibrate())
        .setDescription(channelPOJO.getDescription())
        .setChannelName(channelPOJO.getChannelName())
        .setChannelId(scope(channelPOJO.getChannelId()))
        .setGroupId(scope(channelPOJO.getGroupId()))
        .build();
  }
}
