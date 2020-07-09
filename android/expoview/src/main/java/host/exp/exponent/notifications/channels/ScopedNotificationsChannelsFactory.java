package host.exp.exponent.notifications.channels;

import android.content.Context;

import expo.modules.notifications.notifications.channels.AndroidXNotificationsChannelsFactory;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelGroupManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsChannelsFactory extends AndroidXNotificationsChannelsFactory {
  private ExperienceId mExperienceId;

  public ScopedNotificationsChannelsFactory(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  public NotificationsChannelManager createChannelManager() {
    return new ScopedNotificationsChannelManager(getContext(), mExperienceId, createGroupManager());
  }

  @Override
  public NotificationsChannelGroupManager createGroupManager() {
    return new ScopedNotificationsGroupManager(getContext(), mExperienceId);
  }

  @Override
  public NotificationsChannelSerializer createChannelSerializer() {
    return super.createChannelSerializer();
  }

  @Override
  public NotificationsChannelGroupSerializer createGroupSerializer() {
    return super.createGroupSerializer();
  }
}
