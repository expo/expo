package expo.modules.notifications.notifications.channels.serializers;

import android.app.NotificationChannelGroup;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public interface NotificationsChannelGroupSerializer {
  String NAME_KEY = "name";
  String DESCRIPTION_KEY = "description";

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  Bundle toBundle(@Nullable NotificationChannelGroup group);
}
