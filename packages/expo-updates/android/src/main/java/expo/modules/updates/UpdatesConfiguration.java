package expo.modules.updates;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.Nullable;

public class UpdatesConfiguration {

  private static final String TAG = UpdatesConfiguration.class.getSimpleName();

  public static final String UPDATES_CONFIGURATION_ENABLED_KEY = "enabled";
  public static final String UPDATES_CONFIGURATION_SCOPE_KEY_KEY = "scopeKey";
  public static final String UPDATES_CONFIGURATION_UPDATE_URL_KEY = "updateUrl";
  public static final String UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "requestHeaders";
  public static final String UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY = "releaseChannel";
  public static final String UPDATES_CONFIGURATION_SDK_VERSION_KEY = "sdkVersion";
  public static final String UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY = "runtimeVersion";
  public static final String UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY = "checkOnLaunch";
  public static final String UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY = "launchWaitMs";
  public static final String UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE = "hasEmbeddedUpdate";

  private static final String UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE = "default";
  private static final int UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE = 0;

  public enum CheckAutomaticallyConfiguration {
    NEVER,
    WIFI_ONLY,
    ALWAYS,
  }

  private boolean mIsEnabled;
  private String mScopeKey;
  private Uri mUpdateUrl;
  private Map<String, String> mRequestHeaders = new HashMap<>();
  private String mSdkVersion;
  private String mRuntimeVersion;
  private String mReleaseChannel = UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE;
  private int mLaunchWaitMs = UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE;
  private CheckAutomaticallyConfiguration mCheckOnLaunch = CheckAutomaticallyConfiguration.ALWAYS;
  private boolean mHasEmbeddedUpdate = true;

  public boolean isEnabled() {
    return mIsEnabled;
  }

  public String getScopeKey() {
    return mScopeKey;
  }

  public Uri getUpdateUrl() {
    return mUpdateUrl;
  }

  public Map<String, String> getRequestHeaders() {
    if (mRequestHeaders == null) {
      return new HashMap<>();
    }
    return mRequestHeaders;
  }

  public String getReleaseChannel() {
    return mReleaseChannel;
  }

  public String getSdkVersion() {
    return mSdkVersion;
  }

  public String getRuntimeVersion() {
    return mRuntimeVersion;
  }

  public CheckAutomaticallyConfiguration getCheckOnLaunch() {
    return mCheckOnLaunch;
  }

  public int getLaunchWaitMs() {
    return mLaunchWaitMs;
  }

  public boolean hasEmbeddedUpdate() {
    return mHasEmbeddedUpdate;
  }

  public UpdatesConfiguration loadValuesFromMetadata(Context context) {
    try {
      ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);

      String urlString = ai.metaData.getString("expo.modules.updates.EXPO_UPDATE_URL");
      mUpdateUrl = urlString == null ? null : Uri.parse(urlString);
      mScopeKey = ai.metaData.getString("expo.modules.updates.EXPO_SCOPE_KEY");
      maybeSetDefaultScopeKey();

      mIsEnabled = ai.metaData.getBoolean("expo.modules.updates.ENABLED", true);
      mSdkVersion = ai.metaData.getString("expo.modules.updates.EXPO_SDK_VERSION");
      mReleaseChannel = ai.metaData.getString("expo.modules.updates.EXPO_RELEASE_CHANNEL", "default");
      mLaunchWaitMs = ai.metaData.getInt("expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS", 0);

      Object runtimeVersion = ai.metaData.get("expo.modules.updates.EXPO_RUNTIME_VERSION");
      mRuntimeVersion = runtimeVersion == null ? null : String.valueOf(runtimeVersion);

      String checkOnLaunchString = ai.metaData.getString("expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH", "ALWAYS");
      try {
        mCheckOnLaunch = CheckAutomaticallyConfiguration.valueOf(checkOnLaunchString);
      } catch (IllegalArgumentException e) {
        Log.e(TAG, "Invalid value " + checkOnLaunchString + " for expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH in AndroidManifest; defaulting to ALWAYS");
        mCheckOnLaunch = CheckAutomaticallyConfiguration.ALWAYS;
      }
    } catch (Exception e) {
      Log.e(TAG, "Could not read expo-updates configuration data in AndroidManifest", e);
    }
    return this;
  }

  public UpdatesConfiguration loadValuesFromMap(Map<String, Object> map) {
    Boolean isEnabledFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_ENABLED_KEY, Boolean.class);
    if (isEnabledFromMap != null) {
      mIsEnabled = isEnabledFromMap;
    }

    Uri updateUrlFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_UPDATE_URL_KEY, Uri.class);
    if (updateUrlFromMap != null) {
      mUpdateUrl = updateUrlFromMap;
    }

    String scopeKeyFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_SCOPE_KEY_KEY, String.class);
    if (scopeKeyFromMap != null) {
      mScopeKey = scopeKeyFromMap;
    }
    maybeSetDefaultScopeKey();

    Map<String, String> requestHeadersFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, Map.class);
    if (requestHeadersFromMap != null) {
      mRequestHeaders = requestHeadersFromMap;
    }

    String releaseChannelFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY, String.class);
    if (releaseChannelFromMap != null) {
      mReleaseChannel = releaseChannelFromMap;
    }

    String sdkVersionFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_SDK_VERSION_KEY, String.class);
    if (sdkVersionFromMap != null) {
      mSdkVersion = sdkVersionFromMap;
    }

    String runtimeVersionFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY, String.class);
    if (runtimeVersionFromMap != null) {
      mRuntimeVersion = runtimeVersionFromMap;
    }

    String checkOnLaunchFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY, String.class);
    if (checkOnLaunchFromMap != null) {
      try {
        mCheckOnLaunch = CheckAutomaticallyConfiguration.valueOf(checkOnLaunchFromMap);
      } catch (IllegalArgumentException e) {
        throw new AssertionError("UpdatesConfiguration failed to initialize: invalid value " + checkOnLaunchFromMap + " provided for checkOnLaunch");
      }
    }

    Integer launchWaitMsFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY, Integer.class);
    if (launchWaitMsFromMap != null) {
      mLaunchWaitMs = launchWaitMsFromMap;
    }

    Boolean hasEmbeddedUpdateFromMap = readValueCheckingType(map, UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE, Boolean.class);
    if (hasEmbeddedUpdateFromMap != null) {
      mHasEmbeddedUpdate = hasEmbeddedUpdateFromMap;
    }

    return this;
  }

  private @Nullable <T> T readValueCheckingType(Map<String, Object> map, String key, Class<T> clazz) {
    if (!map.containsKey(key)) {
      return null;
    }

    Object value = map.get(key);
    if (clazz.isInstance(value)) {
      return clazz.cast(value);
    } else {
      throw new AssertionError("UpdatesConfiguration failed to initialize: bad value of type " + value.getClass().getSimpleName() + " provided for key " + key);
    }
  }

  private void maybeSetDefaultScopeKey() {
    // set updateUrl as the default value if none is provided
    if (mScopeKey == null) {
      if (mUpdateUrl != null) {
        mScopeKey = getNormalizedUrlOrigin(mUpdateUrl);
      } else {
        throw new AssertionError("expo-updates must be configured with a valid update URL or scope key.");
      }
    }
  }

  /* package */ static String getNormalizedUrlOrigin(Uri url) {
    String scheme = url.getScheme();
    int port = url.getPort();
    if (port == getDefaultPortForScheme(scheme)) {
      port = -1;
    }

    return port > -1
      ? scheme + "://" + url.getHost() + ":" + port
      : scheme + "://" + url.getHost();
  }

  private static int getDefaultPortForScheme(String scheme) {
    if ("http".equals(scheme) || "ws".equals(scheme)) {
      return 80;
    } else if ("https".equals(scheme) || "wss".equals(scheme)) {
      return 443;
    } else if ("ftp".equals(scheme)) {
      return 21;
    }
    return -1;
  }
}
