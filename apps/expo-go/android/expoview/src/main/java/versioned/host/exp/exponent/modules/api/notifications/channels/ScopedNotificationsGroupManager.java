package versioned.host.exp.exponent.modules.api.notifications.channels;

import android.app.NotificationChannelGroup;
import android.content.Context;
import android.os.Build;

import expo.modules.core.arguments.ReadableArguments;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager;
import host.exp.exponent.kernel.ExperienceKey;
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

public class ScopedNotificationsGroupManager extends AndroidXNotificationsChannelGroupManager {
  private ExperienceKey mExperienceKey;

  public ScopedNotificationsGroupManager(Context context, ExperienceKey experienceKey) {
    super(context);
    mExperienceKey = experienceKey;
  }

  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannelGroup getNotificationChannelGroup(@NonNull String channelGroupId) {
    NotificationChannelGroup scopedGroup = super.getNotificationChannelGroup(ScopedNotificationsIdUtils.getScopedGroupId(mExperienceKey, channelGroupId));
    if (scopedGroup != null) {
      return scopedGroup;
    }

    // In SDK 38 groups weren't scoped, so we want to return unscoped channel if the scoped one wasn't found.
    return super.getNotificationChannelGroup(channelGroupId);
  }

  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public List<NotificationChannelGroup> getNotificationChannelGroups() {
    ArrayList<NotificationChannelGroup> result = new ArrayList<>();
    List<NotificationChannelGroup> channelGroups = super.getNotificationChannelGroups();
    for (NotificationChannelGroup group : channelGroups) {
      if (ScopedNotificationsIdUtils.checkIfGroupBelongsToExperience(mExperienceKey, group)) {
        result.add(group);
      }
    }

    return result;
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannelGroup createNotificationChannelGroup(@NonNull String groupId, @NonNull CharSequence name, ReadableArguments groupOptions) {
    return super.createNotificationChannelGroup(ScopedNotificationsIdUtils.getScopedGroupId(mExperienceKey, groupId), name, groupOptions);
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public void deleteNotificationChannelGroup(@NonNull String groupId) {
    NotificationChannelGroup groupToRemove = getNotificationChannelGroup(groupId);
    if (groupToRemove != null) {
      super.deleteNotificationChannelGroup(groupToRemove.getId());
    }
  }
}
