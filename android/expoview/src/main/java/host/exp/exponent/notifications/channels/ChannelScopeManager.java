package host.exp.exponent.notifications.channels;

import android.content.Context;

import java.util.concurrent.Future;

public class ChannelScopeManager implements ChannelManager {

  private String mExperienceId = null;

  ChannelManager nextChannelManager = ThreadSafeChannelManager.getInstance();

  ChannelScopeManager(String experienceId) {
    mExperienceId = experienceId;
  }

  @Override
  public void addChannel(String channelId, ChannelPOJO channel, Context context) {
    channelId = scope(channelId);
    channel = scope(channel);
    nextChannelManager.addChannel(channelId, channel, context);
  }

  @Override
  public void deleteChannel(String channelId, Context context) {
    channelId = scope(channelId);
    nextChannelManager.deleteChannel(channelId, context);
  }

  @Override
  public Future<ChannelPOJO> getPropertiesForChannelId(String channelId, Context context) {
    channelId = scope(channelId);
    return nextChannelManager.getPropertiesForChannelId(channelId, context);
  }

  private String scope(String text) {
    if (text == null) {
      return null;
    }
    return mExperienceId + ":" + text;
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
