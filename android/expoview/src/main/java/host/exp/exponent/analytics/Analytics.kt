// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.analytics

import android.app.Application
import android.content.Context
import com.amplitude.api.AmplitudeClient
import com.amplitude.api.Amplitude
import host.exp.exponent.Constants
import host.exp.expoview.ExpoViewBuildConfig
import host.exp.exponent.generated.ExponentKeys
import org.json.JSONException
import org.json.JSONObject
import java.lang.Exception
import java.lang.RuntimeException

object Analytics {
  enum class TimedEvent {
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

  enum class AnalyticsEvent(val eventName: String) {
    ERROR_APPEARED("ERROR_APPEARED"),
    EXPERIENCE_APPEARED("EXPERIENCE_APPEARED"),
    LOAD_EXPERIENCE("LOAD_EXPERIENCE"),
    RELOAD_EXPERIENCE("RELOAD_EXPERIENCE"),
    ERROR_SCREEN("ERROR_SCREEN"),
    ERROR_RELOADED("ERROR_RELOADED"),
    HTTP_USED_CACHE_RESPONSE("HTTP_USED_CACHE_RESPONSE"),
    HTTP_USED_EMBEDDED_RESPONSE("HTTP_USED_EMBEDDED_RESPONSE"),
    LOAD_DEVELOPER_MANIFEST("LOAD_DEVELOPER_MANIFEST"),
    SHELL_EXPERIENCE_LOADED("SHELL_EXPERIENCE_LOADED"),
    EXPERIENCE_LOADED("EXPERIENCE_LOADED"),
    HOME_APPEARED("HOME_APPEARED"),
    LOG_ERROR("LOG_ERROR"),
    NUX_EXPERIENCE_OVERLAY_DISMISSED("NUX_EXPERIENCE_OVERLAY_DISMISSED"),
    INSTALL_REFERRER_RECEIVED("INSTALL_REFERRER_RECEIVED"),
  }

  const val USER_ERROR_MESSAGE = "USER_ERROR_MESSAGE"
  const val DEVELOPER_ERROR_MESSAGE = "DEVELOPER_ERROR_MESSAGE"
  const val MANIFEST_URL = "MANIFEST_URL"

  private const val SDK_VERSION = "SDK_VERSION"

  private val TAG = Analytics::class.java.simpleName

  // Throw away events that took longer than this. Something probably went wrong.
  private const val MAX_DURATION: Long = 30000

  private val shellTimedEvents = mutableMapOf<TimedEvent, Long>()

  // This is a special instance only for the purpose of this class
  // It won't interfere with other AmplitudeClient instances fetched from
  // expo-analytics-amplitude or its versioned equivalents.
  private val amplitudeInstance: AmplitudeClient
    get() = Amplitude.getInstance(Analytics::class.java.canonicalName)

  fun initializeAmplitude(context: Context, application: Application) {
    if (!Constants.ANALYTICS_ENABLED) {
      return
    }

    try {
      amplitudeInstance.initialize(
        context,
        if (ExpoViewBuildConfig.DEBUG) ExponentKeys.AMPLITUDE_DEV_KEY else ExponentKeys.AMPLITUDE_KEY
      )
    } catch (e: RuntimeException) {
      EXL.testError(e)
    }

    amplitudeInstance.enableForegroundTracking(application)

    try {
      val amplitudeUserProperties = JSONObject().apply {
        put("INITIAL_URL", Constants.INITIAL_URL)
        put("ABI_VERSIONS", Constants.ABI_VERSIONS)
        put("TEMPORARY_ABI_VERSION", Constants.TEMPORARY_ABI_VERSION)
      }
      amplitudeInstance.setUserProperties(amplitudeUserProperties)
    } catch (e: JSONException) {
      EXL.e(TAG, e)
    }
  }

  fun logEvent(eventType: AnalyticsEvent) {
    if (!Constants.ANALYTICS_ENABLED) {
      return
    }

    amplitudeInstance.logEvent(eventType.eventName)
  }

  fun logEvent(eventType: AnalyticsEvent, eventProperties: JSONObject) {
    if (!Constants.ANALYTICS_ENABLED) {
      return
    }

    amplitudeInstance.logEvent(eventType.eventName, eventProperties)
  }

  fun logEventWithManifestUrl(eventType: AnalyticsEvent, manifestUrl: String?) {
    logEventWithManifestUrlSdkVersion(eventType, manifestUrl, null)
  }

  fun logEventWithManifestUrlSdkVersion(
    eventType: AnalyticsEvent,
    manifestUrl: String?,
    sdkVersion: String?
  ) {
    if (!Constants.isStandaloneApp() && eventType != AnalyticsEvent.LOAD_EXPERIENCE) {
      return
    }

    try {
      val eventProperties = JSONObject().apply {
        if (manifestUrl != null) {
          put(MANIFEST_URL, manifestUrl)
        }
        if (sdkVersion != null) {
          put(SDK_VERSION, sdkVersion)
        }
      }
      logEvent(eventType, eventProperties)
    } catch (e: Exception) {
      EXL.e(TAG, e.message)
    }
  }

  fun markEvent(event: TimedEvent) {
    shellTimedEvents[event] = System.currentTimeMillis()
  }

  fun sendTimedEvents(manifestUrl: String?) {
    if (manifestUrl == null) {
      return
    }

    try {
      val totalDuration = getDuration(TimedEvent.FINISHED_LOADING_REACT_NATIVE, TimedEvent.LAUNCHER_ACTIVITY_STARTED)
      if (totalDuration == null || totalDuration > MAX_DURATION) {
        shellTimedEvents.clear()
        return
      }
      val eventProperties = JSONObject().apply {
        addDuration(
          "TOTAL_DURATION",
          TimedEvent.FINISHED_LOADING_REACT_NATIVE,
          TimedEvent.LAUNCHER_ACTIVITY_STARTED
        )
        addDuration(
          "LAUNCH_TO_MANIFEST_START_DURATION",
          TimedEvent.STARTED_FETCHING_MANIFEST,
          TimedEvent.LAUNCHER_ACTIVITY_STARTED
        )
        addDuration(
          "MANIFEST_TOTAL_DURATION",
          TimedEvent.FINISHED_FETCHING_MANIFEST,
          TimedEvent.STARTED_FETCHING_MANIFEST
        )
        addDuration(
          "MANIFEST_NETWORK_DURATION",
          TimedEvent.FINISHED_MANIFEST_NETWORK_REQUEST,
          TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST
        )
        addDuration(
          "BUNDLE_FETCH_DURATION",
          TimedEvent.FINISHED_FETCHING_BUNDLE,
          TimedEvent.STARTED_FETCHING_BUNDLE
        )
        addDuration(
          "BUNDLE_WRITE_DURATION",
          TimedEvent.FINISHED_WRITING_BUNDLE,
          TimedEvent.STARTED_WRITING_BUNDLE
        )
        addDuration(
          "REACT_NATIVE_DURATION",
          TimedEvent.FINISHED_LOADING_REACT_NATIVE,
          TimedEvent.STARTED_LOADING_REACT_NATIVE
        )
        put("MANIFEST_URL", manifestUrl)
      }

      val isShell = manifestUrl == Constants.INITIAL_URL
      logEvent(if (isShell) AnalyticsEvent.SHELL_EXPERIENCE_LOADED else AnalyticsEvent.EXPERIENCE_LOADED, eventProperties)
    } catch (e: Exception) {
      EXL.e(TAG, e.message)
    } finally {
      shellTimedEvents.clear()
    }
  }

  fun clearTimedEvents() {
    shellTimedEvents.clear()
  }

  private fun getDuration(end: TimedEvent, start: TimedEvent): Long? {
    return if (!shellTimedEvents.containsKey(end) || !shellTimedEvents.containsKey(start)) {
      null
    } else shellTimedEvents[end]!! - shellTimedEvents[start]!!
  }

  @Throws(JSONException::class)
  private fun JSONObject.addDuration(
    eventName: String,
    end: TimedEvent,
    start: TimedEvent
  ) {
    if (getDuration(end, start) != null) {
      put(eventName, getDuration(end, start))
    }
  }
}
