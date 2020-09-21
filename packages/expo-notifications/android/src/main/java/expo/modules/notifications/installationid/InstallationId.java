package expo.modules.notifications.installationid;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.UUID;

public class InstallationId {
  private static final String LEGACY_PREFERENCES_KEY = "host.exp.exponent.SharedPreferences";
  private static final String PREFERENCES_KEY = "expo.modules.notifications.InstallationId";
  private static final String UUID_KEY = "uuid";

  private SharedPreferences mSharedPreferences;
  private SharedPreferences mLegacySharedPreferences;

  public InstallationId(Context context) {
    mSharedPreferences = context.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE);
    mLegacySharedPreferences = context.getSharedPreferences(LEGACY_PREFERENCES_KEY, Context.MODE_PRIVATE);
  }

  public String getId() {
    return getOrCreateId();
  }

  private String getOrCreateId() {
    String uuid = mSharedPreferences.getString(UUID_KEY, null);
    if (uuid != null) {
      return uuid;
    }

    String legacyUuid = mLegacySharedPreferences.getString(UUID_KEY, null);
    if (legacyUuid != null) {
      mSharedPreferences.edit().putString(UUID_KEY, legacyUuid).apply();
      mLegacySharedPreferences.edit().remove(UUID_KEY).apply();
      return legacyUuid;
    }

    uuid = UUID.randomUUID().toString();
    mSharedPreferences.edit().putString(UUID_KEY, uuid).apply();
    return uuid;
  }
}
