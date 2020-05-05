package expo.modules.notifications.notifications.channels;

import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.os.Build;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

public class NotificationChannelGroupSerializer {
  public static String NAME_KEY = "name";
  public static String DESCRIPTION_KEY = "description";

  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  public static Bundle toBundle(@Nullable NotificationChannelGroup group) {
    if (group == null) {
      return null;
    }
    Bundle result = new Bundle();
    result.putString("id", group.getId());
    result.putString(NAME_KEY, group.getName().toString());
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
      result.putString(DESCRIPTION_KEY, group.getDescription());
      result.putBoolean("isBlocked", group.isBlocked());
    }
    result.putParcelableArrayList("channels", toList(group.getChannels()));
    return result;
  }

  @RequiresApi(api = Build.VERSION_CODES.O)
  public static ArrayList<Bundle> toList(List<NotificationChannel> channels) {
    ArrayList<Bundle> results = new ArrayList<>(channels.size());
    for (NotificationChannel channel : channels) {
      results.add(NotificationChannelSerializer.toBundle(channel));
    }
    return results;
  }
}
