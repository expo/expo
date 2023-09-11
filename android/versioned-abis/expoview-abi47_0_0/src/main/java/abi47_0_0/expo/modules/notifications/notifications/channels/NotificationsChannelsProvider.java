package abi47_0_0.expo.modules.notifications.notifications.channels;

import abi47_0_0.expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import abi47_0_0.expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import abi47_0_0.expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import abi47_0_0.expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;

public interface NotificationsChannelsProvider {
  NotificationsChannelManager getChannelManager();
  NotificationsChannelGroupManager getGroupManager();
  NotificationsChannelSerializer getChannelSerializer();
  NotificationsChannelGroupSerializer getGroupSerializer();
}
