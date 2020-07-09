package host.exp.exponent.notifications.channels;

import android.app.NotificationChannel;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer;

public class ScopedChannelSerializer extends ExpoNotificationsChannelSerializer {
  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getChannelId(@NonNull NotificationChannel channel) {
    return ScopedNotificationsChannelUtils.getUnscopedId(super.getChannelId(channel));
  }

  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getGroupId(@NonNull NotificationChannel channel) {
    return ScopedNotificationsChannelUtils.getUnscopedId(super.getGroupId(channel));
  }
}
