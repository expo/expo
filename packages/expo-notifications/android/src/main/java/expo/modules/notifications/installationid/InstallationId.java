package expo.modules.notifications.installationid;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.UUID;

public class InstallationId {
  private static final String PREFERENCES_KEY = "host.exp.exponent.SharedPreferences";
  private static final String UUID_KEY = "uuid";
  private SharedPreferences mSharedPreferences;

  public InstallationId(Context context) {
    mSharedPreferences = context.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE);
  }

  public String getId() {
    return getOrCreateId();
  }

  private String getOrCreateId() {
    String uuid = mSharedPreferences.getString(UUID_KEY, null);
    if (uuid != null) {
      return uuid;
    }

    uuid = UUID.randomUUID().toString();
    mSharedPreferences.edit().putString(UUID_KEY, uuid).apply();
    return uuid;
  }
}
