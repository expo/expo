package expo.modules.notifications.notifications.channels.managers;

import android.app.NotificationChannel;
import android.os.Build;

import expo.modules.core.arguments.ReadableArguments;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public interface NotificationsChannelManager {
  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  NotificationChannel getNotificationChannel(@NonNull String channelId);

  @NonNull
  @RequiresApi(api = Build.VERSION_CODES.O)
  List<NotificationChannel> getNotificationChannels();

  @RequiresApi(api = Build.VERSION_CODES.O)
  void deleteNotificationChannel(@NonNull String channelId);

  @RequiresApi(api = Build.VERSION_CODES.O)
  NotificationChannel createNotificationChannel(@NonNull String channelId, CharSequence name, int importance, ReadableArguments channelOptions);
}
