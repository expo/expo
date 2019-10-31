package expo.modules.notifications.channels;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_BADGE;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_DESCRIPTION;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_GROUP_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_NAME;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_PRIORITY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_SOUND;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_VIBRATE;

public class ChannelPOJO implements Serializable {

  private String channelId;

  private String channelName;

  private Integer importance; // range from 1 to 5

  private long [] vibrate;

  private boolean badge;

  private boolean sound;

  private String groupId;

  private String description;

  private ChannelPOJO() {}

  public static ChannelPOJO createChannelPOJO(HashMap<String, Object> map) {
    Builder builder = new ChannelPOJO.Builder();

    if (map.containsKey(NOTIFICATION_CHANNEL_PRIORITY)) {
      builder.setImportance(((Number) map.get(NOTIFICATION_CHANNEL_PRIORITY)).intValue());
    } else {
      builder.setImportance(0);
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_BADGE)) {
      builder.setBadge((Boolean) map.get(NOTIFICATION_CHANNEL_BADGE));
    } else {
      builder.setBadge(false);
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_SOUND)) {
      builder.setSound((Boolean) map.get(NOTIFICATION_CHANNEL_SOUND));
    } else {
      builder.setSound(false);
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_NAME)) {
      builder.setChannelName((String) map.get(NOTIFICATION_CHANNEL_NAME));
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_DESCRIPTION)) {
      builder.setDescription((String) map.get(NOTIFICATION_CHANNEL_DESCRIPTION));
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_GROUP_ID)) {
      builder.setGroupId((String) map.get(NOTIFICATION_CHANNEL_GROUP_ID));
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_VIBRATE) && map.get(NOTIFICATION_CHANNEL_VIBRATE) instanceof ArrayList) {
      ArrayList arrayList = (ArrayList) map.get(NOTIFICATION_CHANNEL_VIBRATE);

      long [] array = new long[arrayList.size()];
      for (int i = 0; i < arrayList.size(); ++i) {
        array[i] = ((Number) arrayList.get(i)).longValue();
      }

      builder.setVibrate(array);
    } else {
      builder.setVibrate(new long[]{0, 500});
    }

    if (map.containsKey(NOTIFICATION_CHANNEL_ID)) {
      builder.setChannelId((String) map.get(NOTIFICATION_CHANNEL_ID));
    }

    return builder.build();
  }

  public static class Builder {

    ChannelPOJO mChannelPOJO = new ChannelPOJO();

    public Builder setChannelId(String channelId) {
      mChannelPOJO.channelId = channelId;
      return this;
    }

    public Builder setChannelName(String channelName) {
      mChannelPOJO.channelName = channelName;
      return this;
    }

    public Builder setImportance(int importance) {
      mChannelPOJO.importance = importance;
      return this;
    }

    public Builder setVibrate(long [] vibrate) {
      mChannelPOJO.vibrate = vibrate;
      return this;
    }

    public Builder setBadge(boolean badge) {
      mChannelPOJO.badge = badge;
      return this;
    }

    public Builder setSound(boolean sound) {
      mChannelPOJO.sound = sound;
      return this;
    }

    public Builder setGroupId(String groupId) {
      mChannelPOJO.groupId = groupId;
      return this;
    }

    public Builder setDescription(String description) {
      mChannelPOJO.description = description;
      return this;
    }

    public ChannelPOJO build() {
      return mChannelPOJO;
    }

  }

  public String getChannelId() {
    return channelId;
  }

  public String getChannelName() {
    return channelName;
  }

  public Integer getImportance() {
    return importance;
  }

  public long[] getVibrate() {
    return vibrate;
  }

  public boolean getBadge() {
    return badge;
  }

  public boolean getSound() {
    return sound;
  }

  public String getGroupId() {
    return groupId;
  }

  public String getDescription() {
    return description;
  }

}
