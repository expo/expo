package abi48_0_0.host.exp.exponent.modules.api.notifications.channels;

import android.app.NotificationChannel;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import abi48_0_0.expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelSerializer;
import abi48_0_0.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

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
