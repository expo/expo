package expo.modules.notifications.installationid;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class InstallationId {
  private static final String PREFERENCES_KEY = "host.exp.exponent.SharedPreferences";
  private static final String UUID_KEY = "uuid";
  private static final String REGISTRATION_KEY_PREFIX = "registration-";
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

  public Map<String, Boolean> getRegistrations() {
    Map<String, Boolean> registrations = new HashMap<>();
    for (String key : mSharedPreferences.getAll().keySet()) {
      if (isStorageKey(key)) {
        registrations.put(scopeFromStorageKey(key), mSharedPreferences.getBoolean(key, false));
      }
    }
    return registrations;
  }

  public void setRegistration(String scope, boolean isRegistered) {
    if (isRegistered) {
      mSharedPreferences.edit().putBoolean(storageKeyForScope(scope), true).apply();
    } else {
      mSharedPreferences.edit().remove(storageKeyForScope(scope)).apply();
    }
  }

  private String storageKeyForScope(String scope) {
    return REGISTRATION_KEY_PREFIX + scope;
  }

  private boolean isStorageKey(String storageKey) {
    return storageKey.startsWith(REGISTRATION_KEY_PREFIX);
  }

  private String scopeFromStorageKey(String storageKey) {
    return storageKey.substring(REGISTRATION_KEY_PREFIX.length());
  }
}
