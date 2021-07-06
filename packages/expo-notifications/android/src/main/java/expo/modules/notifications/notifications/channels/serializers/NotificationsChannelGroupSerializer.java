package expo.modules.notifications.notifications.channels.serializers;

import android.app.NotificationChannelGroup;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public interface NotificationsChannelGroupSerializer {
  String ID_KEY = "id";
  String NAME_KEY = "name";
  String DESCRIPTION_KEY = "description";
  String IS_BLOCKED_KEY = "isBlocked";
  String CHANNELS_KEY = "channels";

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  Bundle toBundle(@Nullable NotificationChannelGroup group);
}
