package versioned.host.exp.exponent.modules.api.notifications.channels;

import android.content.Context;

import expo.modules.notifications.notifications.channels.AbstractNotificationsChannelsProvider;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;
import host.exp.exponent.kernel.ExperienceKey;

public class ScopedNotificationsChannelsProvider extends AbstractNotificationsChannelsProvider {
  private ExperienceKey mExperienceKey;

  public ScopedNotificationsChannelsProvider(Context context, ExperienceKey experienceKey) {
    super(context);
    mExperienceKey = experienceKey;
  }

  @Override
  protected NotificationsChannelManager createChannelManager() {
    return new ScopedNotificationsChannelManager(mContext, mExperienceKey, getGroupManager());
  }

  @Override
  protected NotificationsChannelGroupManager createChannelGroupManager() {
    return new ScopedNotificationsGroupManager(mContext, mExperienceKey);
  }

  @Override
  protected NotificationsChannelSerializer createChannelSerializer() {
    return new ScopedChannelSerializer();
  }

  @Override
  protected NotificationsChannelGroupSerializer createChannelGroupSerializer() {
    return new ScopedGroupSerializer(getChannelSerializer());
  }
}
