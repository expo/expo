// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import org.json.JSONArray
import org.json.JSONObject

/**
 * Which network requests get recorded as spans. Unlike the dispatch-side gates, a request
 * rejected here never reaches disk.
 *
 * Persisted, so requests observed before JS configures anything follow the last-applied setting.
 * Mirrors the iOS `NetworkTracesConfiguration`, except for how a partially corrupt blob decodes:
 * this side recovers the readable fields, while iOS falls back to the default wholesale.
 */
data class NetworkTracesConfiguration(
  val enabled: Boolean = false,
  /**
   * Allowed hosts, compared for exact, case-insensitive equality. `null` allows every host;
   * an empty list allows none.
   */
  val hosts: List<String>? = null,
  /** Allowed HTTP methods, compared case-insensitively. `null` allows every method. */
  val methods: List<String>? = null
) {
  /**
   * Whether a request should be recorded. Matching is delegated to `NetworkRequestFilter`, so
   * the capture gate and the JS-facing observer can't drift apart.
   */
  fun allows(url: String, method: String): Boolean {
    if (!enabled) {
      return false
    }
    return filter.matches(url, method)
  }

  // `persist` gates on the OkHttp dispatcher thread, before the hop to the database queue, so this
  // is built once instead of per request. The instance is immutable, so the filter is too.
  private val filter by lazy { NetworkRequestFilter(hosts = hosts, methods = methods) }

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
    fun fromJson(json: String): NetworkTracesConfiguration {
      return runCatching {
        val obj = JSONObject(json)
        NetworkTracesConfiguration(
          enabled = obj.optBoolean("enabled", false),
          hosts = obj.optJSONArray("hosts")?.let { array ->
            List(array.length()) { index -> array.getString(index) }
          },
          methods = obj.optJSONArray("methods")?.let { array ->
            List(array.length()) { index -> array.getString(index) }
          }
        )
      }.getOrDefault(NetworkTracesConfiguration())
    }
  }
}
