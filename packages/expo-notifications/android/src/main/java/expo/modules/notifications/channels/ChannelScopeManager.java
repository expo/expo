package expo.modules.notifications.channels;

import android.content.Context;

import java.util.concurrent.Future;

import expo.modules.notifications.helpers.scoper.StringScoper;

public class ChannelScopeManager implements ChannelManager {

  private StringScoper mStringScoper = null;

  private ChannelManager mNextChannelManager;

  public ChannelScopeManager(StringScoper stringScoper) {
    mStringScoper = stringScoper;
  }

  @Override
  public void setNextChannelManager(ChannelManager channelManager) {
    mNextChannelManager = channelManager;
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
    mNextChannelManager.addChannel(channelId, channel, context, continuation);
  }

  @Override
  public void deleteChannel(String channelId, Context context, Runnable continuation) {
    channelId = scope(channelId);
    mNextChannelManager.deleteChannel(channelId, context, continuation);
  }

  @Override
  public Future<ChannelSpecification> getPropertiesForChannelId(String channelId, Context context) {
    channelId = scope(channelId);
    return mNextChannelManager.getPropertiesForChannelId(channelId, context);
  }

  private String scope(String text) {
    return mStringScoper.getScopedString(text);
  }

  private ChannelSpecification scope(ChannelSpecification channelSpecification) {
    ChannelSpecification.Builder builder = new ChannelSpecification.Builder();
    return builder.setImportance(channelSpecification.getImportance())
        .setBadge(channelSpecification.getBadge())
        .setSound(channelSpecification.getSound())
        .setShouldVibrate(channelSpecification.getVibrationFlag())
        .setVibrate(channelSpecification.getVibrate())
        .setDescription(channelSpecification.getDescription())
        .setChannelName(channelSpecification.getChannelName())
        .setChannelId(scope(channelSpecification.getChannelId()))
        .setGroupId(scope(channelSpecification.getGroupId()))
        .build();
  }
}
