package abi42_0_0.host.exp.exponent.modules.universal;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import abi42_0_0.org.unimodules.core.Promise;
import abi42_0_0.org.unimodules.core.arguments.ReadableArguments;

import java.security.KeyStore;
import java.util.Map;

import abi42_0_0.expo.modules.securestore.SecureStoreModule;
import host.exp.exponent.Constants;
import host.exp.exponent.utils.ScopedContext;

public class ScopedSecureStoreModule extends SecureStoreModule {
  private static final String SHARED_PREFERENCES_NAME = "SecureStore";
  private Context mScopedContext;

  public ScopedSecureStoreModule(ScopedContext scopedContext) {
    super(Constants.isStandaloneApp() ? scopedContext.getBaseContext() : scopedContext);
    mScopedContext = scopedContext;
    maybeMigrateSharedPreferences();
  }

  // In standalone apps on SDK 41 and below, SecureStore was initiated with scoped context, 
  // so SharedPreferences was scoped to that particular experienceId. This meant you
  // would lose data upon ejecting to bare. With this method, we can migrate apps' SecureStore
  // data from the scoped SharedPreferences SecureStore file, to unscoped, so data will persist
  // even after ejecting.
  private void maybeMigrateSharedPreferences() {
    SharedPreferences prefs = super.getSharedPreferences();
    SharedPreferences legacyPrefs = getScopedSharedPreferences();
    boolean shouldMigratePreferencesData = Constants.isStandaloneApp() && prefs.getAll().isEmpty() && !legacyPrefs.getAll().isEmpty();
    if (shouldMigratePreferencesData) {
      Map<String,?> keys = legacyPrefs.getAll();
      for(Map.Entry<String,?> entry : keys.entrySet()){
        String key = entry.getKey();
        String value = entry.getValue().toString();
        boolean success = prefs.edit().putString(key, value).commit();
        if (!success) {
          Log.e("E_SECURESTORE_WRITE_ERROR", "Could not transfer SecureStore data to new storage.");
        }
      }
    }
  }

  protected SharedPreferences getScopedSharedPreferences() {
    return mScopedContext.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
  }
}
