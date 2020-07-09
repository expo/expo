package expo.modules.notifications.notifications.channels;

import android.content.Context;

import org.unimodules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;

public class AndroidXNotificationsChannelsFactory implements NotificationsChannelsFactory, InternalModule {
  private Context mContext;

  public AndroidXNotificationsChannelsFactory(Context context) {
    mContext = context;
  }

  public Context getContext() {
    return mContext;
  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(NotificationsChannelsFactory.class);
  }

  @Override
  public NotificationsChannelManager createChannelManager() {
    return new AndroidXNotificationsChannelManager(mContext, createGroupManager());
  }

  @Override
  public NotificationsChannelGroupManager createGroupManager() {
    return new AndroidXNotificationsChannelGroupManager(mContext);
  }

  @Override
  public NotificationsChannelSerializer createChannelSerializer() {
    return new ExpoNotificationsChannelSerializer();
  }

  @Override
  public NotificationsChannelGroupSerializer createGroupSerializer() {
    return new ExpoNotificationsChannelGroupSerializer(createChannelSerializer());
  }
}
