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
  public void addChannel(String channelId, ChannelSpecification channel, Context context) {
    addChannel(channelId, channel, context, () -> {});
  }

  @Override
  public void deleteChannel(String channelId, Context context) {
    deleteChannel(channelId, context, () -> {});
  }

  @Override
  public void addChannel(String channelId, ChannelSpecification channel, Context context, Runnable continuation) {
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
  public Future<ChannelSpecification> getPropertiesForChannelId(String channelId, Context context) {
    channelId = scope(channelId);
    return nextChannelManager.getPropertiesForChannelId(channelId, context);
  }

  private String scope(String text) {
    return mStringScoper.getScopedString(text);
  }

  private ChannelSpecification scope(ChannelSpecification channelSpecification) {
    ChannelSpecification.Builder builder = new ChannelSpecification.Builder();
    return builder.setImportance(channelSpecification.getImportance())
        .setBadge(channelSpecification.getBadge())
        .setSound(channelSpecification.getSound())
        .setVibrate(channelSpecification.getVibrate())
        .setDescription(channelSpecification.getDescription())
        .setChannelName(channelSpecification.getChannelName())
        .setChannelId(scope(channelSpecification.getChannelId()))
        .setGroupId(scope(channelSpecification.getGroupId()))
        .build();
  }
}
