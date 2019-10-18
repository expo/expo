package expo.modules.notifications.channels;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(version = ChannelPropertiesDatabase.VERSION)
public class ChannelPropertiesDatabase {
  public static final String NAME = ChannelPropertiesDatabase.class.getCanonicalName();
  public static final int VERSION = 1;
}