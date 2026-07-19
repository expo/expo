package versioned.host.exp.exponent.modules.api.notifications.channels;

import android.app.NotificationChannelGroup;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

public class ScopedGroupSerializer extends ExpoNotificationsChannelGroupSerializer {
  public ScopedGroupSerializer(NotificationsChannelSerializer channelSerializer) {
    super(channelSerializer);
  }

  @Nullable
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getId(@NonNull NotificationChannelGroup channel) {
    return ScopedNotificationsIdUtils.getUnscopedId(super.getId(channel));
  }
}
