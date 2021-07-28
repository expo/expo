package expo.modules.notifications.notifications.channels.managers;

import android.app.NotificationChannelGroup;
import android.os.Build;

import expo.modules.core.arguments.ReadableArguments;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public interface NotificationsChannelGroupManager {
  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  NotificationChannelGroup getNotificationChannelGroup(@NonNull String channelGroupId);

  @NonNull
  @RequiresApi(api = Build.VERSION_CODES.O)
  List<NotificationChannelGroup> getNotificationChannelGroups();

  @RequiresApi(api = Build.VERSION_CODES.O)
  NotificationChannelGroup createNotificationChannelGroup(@NonNull String id, @NonNull CharSequence name, ReadableArguments groupOptions);

  @RequiresApi(api = Build.VERSION_CODES.O)
  void deleteNotificationChannelGroup(@NonNull String groupId);
}
