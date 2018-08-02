// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.analytics;

import android.app.Application;
import android.content.Context;

import com.amplitude.api.Amplitude;

import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.Constants;
import host.exp.exponent.generated.ExponentKeys;
import host.exp.expoview.ExpoViewBuildConfig;

public class Analytics {

  public static final String ERROR_APPEARED = "ERROR_APPEARED";
  public static final String EXPERIENCE_APPEARED = "EXPERIENCE_APPEARED";
  public static final String LOAD_EXPERIENCE = "LOAD_EXPERIENCE";
  public static final String INFO_SCREEN = "INFO_SCREEN";
  public static final String RELOAD_EXPERIENCE = "RELOAD_EXPERIENCE";
  public static final String SAVE_EXPERIENCE = "SAVE_EXPERIENCE";
  public static final String SAVE_EXPERIENCE_ALERT = "SAVE_EXPERIENCE_ALERT";
  public static final String SAVE_EXPERIENCE_OPTION_YES = "SAVE_EXPERIENCE_OPTION_YES";
  public static final String SAVE_EXPERIENCE_OPTION_NO = "SAVE_EXPERIENCE_OPTION_NO";
  public static final String ERROR_SCREEN = "ERROR_SCREEN";
  public static final String ERROR_RELOADED = "ERROR_RELOADED";
  public static final String HTTP_USED_CACHE_RESPONSE = "HTTP_USED_CACHE_RESPONSE";
  public static final String HTTP_USED_EMBEDDED_RESPONSE = "HTTP_USED_EMBEDDED_RESPONSE";
  public static final String LOAD_DEVELOPER_MANIFEST = "LOAD_DEVELOPER_MANIFEST";

  public static final String MANIFEST_URL = "MANIFEST_URL";
  public static final String SDK_VERSION = "SDK_VERSION";
  public static final String USER_ERROR_MESSAGE = "USER_ERROR_MESSAGE";
  public static final String DEVELOPER_ERROR_MESSAGE = "DEVELOPER_ERROR_MESSAGE";

  public enum TimedEvent {
    LAUNCHER_ACTIVITY_STARTED,
    STARTED_FETCHING_MANIFEST,
    STARTED_MANIFEST_NETWORK_REQUEST,
    FINISHED_MANIFEST_NETWORK_REQUEST,
    FINISHED_FETCHING_MANIFEST,
    STARTED_FETCHING_BUNDLE,
    FINISHED_FETCHING_BUNDLE,
    STARTED_WRITING_BUNDLE,
    FINISHED_WRITING_BUNDLE,
    STARTED_LOADING_REACT_NATIVE,
    FINISHED_LOADING_REACT_NATIVE
  }

  private static final String TAG = Analytics.class.getSimpleName();
  // Throw away events that took longer than this. Something probably went wrong.
  private static final long MAX_DURATION = 30000;

  private static final Map<TimedEvent, Long> sShellTimedEvents = new HashMap<>();

  public static void initializeAmplitude(Context context, Application application) {
    if (!Constants.ANALYTICS_ENABLED) {
      return;
    }

    resetAmplitudeDatabaseHelper();

    try {
      Amplitude.getInstance().initialize(context, ExpoViewBuildConfig.DEBUG ? ExponentKeys.AMPLITUDE_DEV_KEY : ExponentKeys.AMPLITUDE_KEY);
    } catch (RuntimeException e) {
      EXL.testError(e);
    }

    if (application != null) {
      Amplitude.getInstance().enableForegroundTracking(application);
    }
    try {
      JSONObject amplitudeUserProperties = new JSONObject();
      amplitudeUserProperties.put("INITIAL_URL", Constants.INITIAL_URL);
      amplitudeUserProperties.put("ABI_VERSIONS", Constants.ABI_VERSIONS);
      amplitudeUserProperties.put("TEMPORARY_ABI_VERSION", Constants.TEMPORARY_ABI_VERSION);
      amplitudeUserProperties.put("IS_DETACHED", Constants.isDetached());
      Amplitude.getInstance().setUserProperties(amplitudeUserProperties);
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }
  }

  public static void logEvent(String eventType) {
    if (!Constants.ANALYTICS_ENABLED) {
      return;
    }
    Amplitude.getInstance().logEvent(eventType);
  }

  public static void logEvent(String eventType, JSONObject eventProperties) {
    if (!Constants.ANALYTICS_ENABLED) {
      return;
    }
    Amplitude.getInstance().logEvent(eventType, eventProperties);
  }

  public static void logEventWithManifestUrl(String eventType, String manifestUrl) {
    logEventWithManifestUrlSdkVersion(eventType, manifestUrl, null);
  }

  public static void logEventWithManifestUrlSdkVersion(String eventType, String manifestUrl, String sdkVersion) {
    if (!Constants.isShellApp() && (!eventType.equals(LOAD_EXPERIENCE))) {
      return;
    }
    try {
      JSONObject eventProperties = new JSONObject();
      if (manifestUrl != null) {
        eventProperties.put(MANIFEST_URL, manifestUrl);
      }
      if (sdkVersion != null) {
        eventProperties.put(SDK_VERSION, sdkVersion);
      }
      logEvent(eventType, eventProperties);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
    }
  }

  public static void markEvent(TimedEvent event) {
    sShellTimedEvents.put(event, System.currentTimeMillis());
  }

  public static void sendTimedEvents(String manifestUrl) {
    if (manifestUrl == null) {
      return;
    }

    try {
      Long totalDuration = getDuration(TimedEvent.FINISHED_LOADING_REACT_NATIVE, TimedEvent.LAUNCHER_ACTIVITY_STARTED);
      if (totalDuration == null || totalDuration > MAX_DURATION) {
        sShellTimedEvents.clear();
        return;
      }

      JSONObject eventProperties = new JSONObject();
      addDuration(eventProperties, "TOTAL_DURATION", TimedEvent.FINISHED_LOADING_REACT_NATIVE, TimedEvent.LAUNCHER_ACTIVITY_STARTED);
      addDuration(eventProperties, "LAUNCH_TO_MANIFEST_START_DURATION", TimedEvent.STARTED_FETCHING_MANIFEST, TimedEvent.LAUNCHER_ACTIVITY_STARTED);
      addDuration(eventProperties, "MANIFEST_TOTAL_DURATION", TimedEvent.FINISHED_FETCHING_MANIFEST, TimedEvent.STARTED_FETCHING_MANIFEST);
      addDuration(eventProperties, "MANIFEST_NETWORK_DURATION", TimedEvent.FINISHED_MANIFEST_NETWORK_REQUEST, TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST);
      addDuration(eventProperties, "BUNDLE_FETCH_DURATION", TimedEvent.FINISHED_FETCHING_BUNDLE, TimedEvent.STARTED_FETCHING_BUNDLE);
      addDuration(eventProperties, "BUNDLE_WRITE_DURATION", TimedEvent.FINISHED_WRITING_BUNDLE, TimedEvent.STARTED_WRITING_BUNDLE);
      addDuration(eventProperties, "REACT_NATIVE_DURATION", TimedEvent.FINISHED_LOADING_REACT_NATIVE, TimedEvent.STARTED_LOADING_REACT_NATIVE);

      eventProperties.put("MANIFEST_URL", manifestUrl);

      boolean isShell = manifestUrl.equals(Constants.INITIAL_URL);
      logEvent(isShell ? "SHELL_EXPERIENCE_LOADED" : "EXPERIENCE_LOADED", eventProperties);
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
    } finally {
      sShellTimedEvents.clear();
    }
  }

  public static void clearTimedEvents() {
    sShellTimedEvents.clear();
  }

  private static Long getDuration(TimedEvent end, TimedEvent start) {
    if (!sShellTimedEvents.containsKey(end) || !sShellTimedEvents.containsKey(start)) {
      return null;
    }

    return sShellTimedEvents.get(end) - sShellTimedEvents.get(start);
  }

  private static void addDuration(JSONObject eventProperties, String eventName, TimedEvent end, TimedEvent start) throws JSONException {
    if (getDuration(end, start) != null) {
      eventProperties.put(eventName, getDuration(end, start));
    }
  }

  public static void resetAmplitudeDatabaseHelper() {
    try {
      Field field = Class.forName("com.amplitude.api.DatabaseHelper").getDeclaredField("instance");
      field.setAccessible(true);
      field.set(null, null);
    } catch (Throwable e) {
      EXL.e(TAG, e.toString());
    }
  }
}
