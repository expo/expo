package versioned.host.exp.exponent.modules.api.notifications.channels;

import android.content.Context;

import expo.modules.notifications.notifications.channels.AbstractNotificationsChannelsProvider;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsChannelsProvider extends AbstractNotificationsChannelsProvider {
  private ExperienceId mExperienceId;

  public ScopedNotificationsChannelsProvider(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  protected NotificationsChannelManager createChannelManager() {
    return new ScopedNotificationsChannelManager(mContext, mExperienceId, getGroupManager());
  }

  @Override
  protected NotificationsChannelGroupManager createChannelGroupManager() {
    return new ScopedNotificationsGroupManager(mContext, mExperienceId);
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
