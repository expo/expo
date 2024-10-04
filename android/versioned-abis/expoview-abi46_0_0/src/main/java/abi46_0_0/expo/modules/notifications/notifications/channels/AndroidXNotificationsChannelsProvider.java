package abi46_0_0.expo.modules.notifications.notifications.channels;

import android.content.Context;

import abi46_0_0.expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager;
import abi46_0_0.expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager;
import abi46_0_0.expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import abi46_0_0.expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import abi46_0_0.expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer;
import abi46_0_0.expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer;
import abi46_0_0.expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import abi46_0_0.expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;

public class AndroidXNotificationsChannelsProvider extends AbstractNotificationsChannelsProvider {
  public AndroidXNotificationsChannelsProvider(Context context) {
    super(context);
  }

  @Override
  protected NotificationsChannelManager createChannelManager() {
    return new AndroidXNotificationsChannelManager(mContext, getGroupManager());
  }

  @Override
  protected NotificationsChannelGroupManager createChannelGroupManager() {
    return new AndroidXNotificationsChannelGroupManager(mContext);
  }

  @Override
  protected NotificationsChannelSerializer createChannelSerializer() {
    return new ExpoNotificationsChannelSerializer();
  }

  @Override
  protected NotificationsChannelGroupSerializer createChannelGroupSerializer() {
    return new ExpoNotificationsChannelGroupSerializer(getChannelSerializer());
  }
}
