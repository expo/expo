package expo.modules.notifications.channels;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(name = ChannelPropertiesDatabase.NAME, version = ChannelPropertiesDatabase.VERSION)
public class ChannelPropertiesDatabase {
  public static final String NAME = "ExpoNotificationActions";
  public static final int VERSION = 1;
}