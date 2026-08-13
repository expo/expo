// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import org.json.JSONArray
import org.json.JSONObject

/**
 * Capture-time recording policy for network request spans: whether completed requests are
 * written to the `spans` table at all, plus an optional host/method allowlist. Consulted by
 * `NetworkRequestPersistence` before each insert — a request rejected here never reaches disk,
 * unlike the dispatch-side gates (`dispatchingEnabled`, sampling) which only suppress the
 * upload of rows that were already persisted.
 *
 * Persisted in `AppMetricsPreferences` so requests observed before JS configuration runs
 * (early startup, or the next launch) follow the last-applied setting. Mirrors the iOS
 * `NetworkSpansConfiguration`.
 */
data class NetworkSpansConfiguration(
  val enabled: Boolean = true,
  /**
   * Allowed hosts, compared for exact, case-insensitive equality. `null` allows every host;
   * an empty list allows none.
   */
  val hosts: List<String>? = null,
  /** Allowed HTTP methods, compared case-insensitively. `null` allows every method. */
  val methods: List<String>? = null
) {
  /**
   * Whether a request with the given URL and method should be recorded. Mirrors the
   * `NetworkRequestFilter.matches` semantics used by the JS-facing observer.
   */
  fun allows(url: String, method: String): Boolean {
    if (!enabled) {
      return false
    }
    hosts?.let { allowedHosts ->
      val host = url.toHttpUrlOrNull()?.host
      val allowed = allowedHosts.any { it.equals(host, ignoreCase = true) }
      if (!allowed) {
        return false
      }
    }
    methods?.let { allowedMethods ->
      val allowed = allowedMethods.any { it.equals(method, ignoreCase = true) }
      if (!allowed) {
        return false
      }
    }
    return true
  }

  /** JSON form for the preferences store. */
  fun toJson(): String {
    val json = JSONObject()
    json.put("enabled", enabled)
    hosts?.let { json.put("hosts", JSONArray(it)) }
    methods?.let { json.put("methods", JSONArray(it)) }
    return json.toString()
  }

  companion object {
    /** Parses the preferences-store form; a malformed blob falls back to the default policy. */
    fun fromJson(json: String): NetworkSpansConfiguration {
      return runCatching {
        val obj = JSONObject(json)
        NetworkSpansConfiguration(
          enabled = obj.optBoolean("enabled", true),
          hosts = obj.optJSONArray("hosts")?.let { array ->
            List(array.length()) { index -> array.getString(index) }
          },
          methods = obj.optJSONArray("methods")?.let { array ->
            List(array.length()) { index -> array.getString(index) }
          }
        )
      }.getOrDefault(NetworkSpansConfiguration())
    }
  }
}
