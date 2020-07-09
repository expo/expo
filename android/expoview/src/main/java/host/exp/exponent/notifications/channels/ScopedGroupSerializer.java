package host.exp.exponent.notifications.channels;

import android.app.NotificationChannelGroup;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import expo.modules.notifications.notifications.channels.serializers.ExpoNotificationsChannelGroupSerializer;
import expo.modules.notifications.notifications.channels.serializers.NotificationsChannelSerializer;

public class ScopedGroupSerializer extends ExpoNotificationsChannelGroupSerializer {
  public ScopedGroupSerializer(NotificationsChannelSerializer channelSerializer) {
    super(channelSerializer);
  }

  @NonNull
  @Override
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected String getId(@NonNull NotificationChannelGroup channel) {
    return ScopedNotificationsChannelUtils.getUnscopedId(super.getId(channel));
  }
}
