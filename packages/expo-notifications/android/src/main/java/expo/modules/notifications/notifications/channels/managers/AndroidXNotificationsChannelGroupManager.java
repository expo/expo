package expo.modules.notifications.notifications.channels.managers;

import android.app.NotificationChannelGroup;
import android.content.Context;
import android.os.Build;

import expo.modules.core.arguments.ReadableArguments;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationManagerCompat;

import static expo.modules.notifications.notifications.channels.serializers.NotificationsChannelGroupSerializer.DESCRIPTION_KEY;

public class AndroidXNotificationsChannelGroupManager implements NotificationsChannelGroupManager {
  private final NotificationManagerCompat mNotificationManager;

  public AndroidXNotificationsChannelGroupManager(Context context) {
    mNotificationManager = NotificationManagerCompat.from(context);
  }

  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannelGroup getNotificationChannelGroup(@NonNull String channelGroupId) {
    return mNotificationManager.getNotificationChannelGroup(channelGroupId);
  }

  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public List<NotificationChannelGroup> getNotificationChannelGroups() {
    return mNotificationManager.getNotificationChannelGroups();
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public NotificationChannelGroup createNotificationChannelGroup(@NonNull String groupId, @NonNull CharSequence name, ReadableArguments groupOptions) {
    NotificationChannelGroup group = new NotificationChannelGroup(groupId, name);
    configureGroupWithOptions(group, groupOptions);
    mNotificationManager.createNotificationChannelGroup(group);
    return group;
  }

  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  public void deleteNotificationChannelGroup(@NonNull String groupId) {
     mNotificationManager.deleteNotificationChannelGroup(groupId);
  }

  // Processing options
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected void configureGroupWithOptions(Object maybeGroup, ReadableArguments groupOptions) {
    if (!(maybeGroup instanceof NotificationChannelGroup group)) {
      return;
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      if (groupOptions.containsKey(DESCRIPTION_KEY)) {
        group.setDescription(groupOptions.getString(DESCRIPTION_KEY));
      }
    }
  }
}
