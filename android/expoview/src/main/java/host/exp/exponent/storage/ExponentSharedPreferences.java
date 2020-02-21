// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.storage;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.inject.Inject;
import javax.inject.Singleton;

import host.exp.expoview.ExpoViewBuildConfig;
import host.exp.expoview.R;
import host.exp.exponent.analytics.EXL;

import static host.exp.exponent.kernel.KernelConstants.BUNDLE_URL_KEY;
import static host.exp.exponent.kernel.KernelConstants.MANIFEST_KEY;

@Singleton
public class ExponentSharedPreferences {

  private static final String TAG = ExponentSharedPreferences.class.getSimpleName();

  public static class ManifestAndBundleUrl {
    public final JSONObject manifest;
    public final String bundleUrl;

    ManifestAndBundleUrl(JSONObject manifest, String bundleUrl) {
      this.manifest = manifest;
      this.bundleUrl = bundleUrl;
    }
  }

  // Dev options
  public static final String USE_INTERNET_KERNEL_KEY = "use_internet_kernel";

  // Other
  public static final String IS_FIRST_KERNEL_RUN_KEY = "is_first_kernel_run";
  public static final String HAS_SAVED_SHORTCUT_KEY = "has_saved_shortcut";
  public static final String UUID_KEY = "uuid";
  public static final String GCM_TOKEN_KEY = "gcm_token";
  public static final String FCM_TOKEN_KEY = "fcm_token";
  public static final String REFERRER_KEY = "referrer";
  public static final String NUX_HAS_FINISHED_FIRST_RUN_KEY = "nux_has_finished_first_run";
  public static final String IS_ONBOARDING_FINISHED_KEY = "is_onboarding_finished";
  public static final String SHOULD_NOT_USE_KERNEL_CACHE = "should_not_use_kernel_cache";
  public static final String KERNEL_REVISION_ID = "kernel_revision_id";
  public static final String SAFE_MANIFEST_KEY = "safe_manifest";
  public static final String EXPO_AUTH_SESSION = "expo_auth_session";
  public static final String EXPO_AUTH_SESSION_SECRET_KEY = "sessionSecret";

  // Metadata
  public static final String EXPERIENCE_METADATA_PREFIX = "experience_metadata_";
  public static final String EXPERIENCE_METADATA_LAST_ERRORS = "lastErrors";
  public static final String EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS = "unreadNotifications";
  public static final String EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS = "allNotificationIds";
  public static final String EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS = "allScheduledNotificationIds";
  public static final String EXPERIENCE_METADATA_LOADING_ERROR = "loadingError";
  public static final String EXPERIENCE_METADATA_PERMISSIONS = "permissions";
  public static final String EXPERIENCE_METADATA_NOTIFICATION_CHANNELS = "notificationChannels";

  private static final Map<String, Boolean> DEFAULT_VALUES = new HashMap<>();

  static {
    DEFAULT_VALUES.put(USE_INTERNET_KERNEL_KEY, ExpoViewBuildConfig.USE_INTERNET_KERNEL);
    DEFAULT_VALUES.put(HAS_SAVED_SHORTCUT_KEY, false);
    DEFAULT_VALUES.put(IS_FIRST_KERNEL_RUN_KEY, true);
    DEFAULT_VALUES.put(IS_ONBOARDING_FINISHED_KEY, false);
    DEFAULT_VALUES.put(NUX_HAS_FINISHED_FIRST_RUN_KEY, false);
    DEFAULT_VALUES.put(SHOULD_NOT_USE_KERNEL_CACHE, false);
  }

  private SharedPreferences mSharedPreferences;
  private Context mContext;

  @Inject
  public ExponentSharedPreferences(Context context) {
    mSharedPreferences = context.getSharedPreferences(context.getString(R.string.preference_file_key), Context.MODE_PRIVATE);
    mContext = context;

    // We renamed `nux` to `onboarding` in January 2020 - the old preference key can be removed from here after some time,
    // but since then we need to rewrite nux setting to the new key.
    if (!mSharedPreferences.contains(IS_ONBOARDING_FINISHED_KEY)) {
      setBoolean(IS_ONBOARDING_FINISHED_KEY, getBoolean(NUX_HAS_FINISHED_FIRST_RUN_KEY));
    }
  }

  public Context getContext() {
    return mContext;
  }

  public boolean getBoolean(String key) {
    return mSharedPreferences.getBoolean(key, DEFAULT_VALUES.get(key));
  }

  public boolean getBoolean(String key, boolean defaultValue) {
    return mSharedPreferences.getBoolean(key, defaultValue);
  }

  public void setBoolean(String key, boolean value) {
    mSharedPreferences.edit().putBoolean(key, value).apply();
  }

  public String getString(String key) {
    return getString(key, null);
  }

  public String getString(String key, String defaultValue) {
    return mSharedPreferences.getString(key, defaultValue);
  }

  public void setString(String key, String value) {
    mSharedPreferences.edit().putString(key, value).apply();
  }

  public void delete(String key) {
    mSharedPreferences.edit().remove(key).apply();
  }

  public boolean shouldUseInternetKernel() {
    return getBoolean(USE_INTERNET_KERNEL_KEY);
  }

  public boolean hasSavedShortcut() {
    return getBoolean(HAS_SAVED_SHORTCUT_KEY);
  }

  public String getUUID() {
    return mSharedPreferences.getString(UUID_KEY, null);
  }

  public String getOrCreateUUID() {
    String uuid = mSharedPreferences.getString(UUID_KEY, null);
    if (uuid != null) {
      return uuid;
    }

    uuid = UUID.randomUUID().toString();
    setString(UUID_KEY, uuid);
    return uuid;
  }

  public void updateSession(JSONObject session) {
    setString(EXPO_AUTH_SESSION, session.toString());
  }

  public void removeSession() {
    setString(EXPO_AUTH_SESSION, null);
  }

  public String getSessionSecret() {
    String sessionString = getString(EXPO_AUTH_SESSION);
    if (sessionString == null) {
      return null;
    }
    try {
      JSONObject session = new JSONObject(sessionString);
      return session.getString(EXPO_AUTH_SESSION_SECRET_KEY);
    } catch (Exception e) {
      EXL.e(TAG, e);
      return null;
    }
  }

  public void updateManifest(String manifestUrl, JSONObject manifest, String bundleUrl) {
    try {
      JSONObject parentObject = new JSONObject();
      parentObject.put(MANIFEST_KEY, manifest);
      parentObject.put(BUNDLE_URL_KEY, bundleUrl);
      parentObject.put(SAFE_MANIFEST_KEY, manifest);

      mSharedPreferences.edit().putString(manifestUrl, parentObject.toString()).apply();
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }
  }

  public ManifestAndBundleUrl getManifest(String manifestUrl) {
    String jsonString = mSharedPreferences.getString(manifestUrl, null);
    if (jsonString == null) {
      return null;
    }

    try {
      JSONObject json = new JSONObject(jsonString);
      JSONObject manifest = json.getJSONObject(MANIFEST_KEY);
      String bundleUrl = json.getString(BUNDLE_URL_KEY);

      return new ManifestAndBundleUrl(manifest, bundleUrl);
    } catch (JSONException e) {
      EXL.e(TAG, e);
      return null;
    }
  }

  public void updateSafeManifest(String manifestUrl, JSONObject manifest) {
    try {
      JSONObject parentObject;
      String jsonString = mSharedPreferences.getString(manifestUrl, null);
      if (jsonString != null) {
        parentObject = new JSONObject(jsonString);
      } else {
        parentObject = new JSONObject();
      }
      parentObject.put(SAFE_MANIFEST_KEY, manifest);

      mSharedPreferences.edit().putString(manifestUrl, parentObject.toString()).apply();
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }
  }

  public String getSafeManifestString(String manifestUrl) {
    String jsonString = mSharedPreferences.getString(manifestUrl, null);
    if (jsonString == null) {
      return null;
    }

    try {
      JSONObject json = new JSONObject(jsonString);
      return json.getString(SAFE_MANIFEST_KEY);
    } catch (JSONException e) {
      EXL.e(TAG, e);
      return null;
    }
  }

  public void updateExperienceMetadata(String id, JSONObject metadata) {
    mSharedPreferences.edit().putString(EXPERIENCE_METADATA_PREFIX + id, metadata.toString()).apply();
  }

  public JSONObject getExperienceMetadata(String id) {
    String jsonString = mSharedPreferences.getString(EXPERIENCE_METADATA_PREFIX + id, null);
    if (jsonString == null) {
      return null;
    }

    try {
      return new JSONObject(jsonString);
    } catch (JSONException e) {
      EXL.e(TAG, e);
      return null;
    }
  }
}
