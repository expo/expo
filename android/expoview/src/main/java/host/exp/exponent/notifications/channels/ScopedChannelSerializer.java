package host.exp.exponent.notifications.channels;

import android.app.NotificationChannel;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer;
import host.exp.exponent.notifications.ScopedNotificationsIdUtils;

public class ScopedChannelSerializer extends ExpoNotificationsChannelSerializer {
  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getChannelId(@NonNull NotificationChannel channel) {
    return ScopedNotificationsIdUtils.getUnscopedId(super.getChannelId(channel));
  }

  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getGroupId(@NonNull NotificationChannel channel) {
    return ScopedNotificationsIdUtils.getUnscopedId(super.getGroupId(channel));
  }
}
