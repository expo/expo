// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/**
 * Declares which requests a `NetworkRequestObserver` emits events for. Mirrors the JS
 * `NetworkRequestFilter` type and the iOS `NetworkRequestFilter`.
 *
 * Only attributes knowable the moment a request starts are supported — host and method — so the
 * same predicate yields the same answer at start and at completion. That keeps the
 * `requestStarted`/`requestCompleted` pair consistent: a request that matches always emits both, a
 * request that doesn't matches neither.
 *
 * Different fields combine with AND; entries within a field combine with OR. A field that is left
 * unset (`null`) places no constraint on its dimension, while a field set to an empty list allows
 * nothing through it (an empty allow-list matches no value), so any empty field drops every
 * request. A filter with no fields set matches every request, matching the no-filter default.
 */
@OptimizedRecord
data class NetworkRequestFilter(
  /**
   * Exact host matches, compared case-insensitively against the request URL's host.
   */
  @Field val hosts: List<String>? = null,
  /**
   * Allowed HTTP methods (`GET`, `POST`, …), compared case-insensitively.
   */
  @Field val methods: List<String>? = null
) : Record {
  /**
   * Returns whether a request with the given URL and method passes this filter. Host and method
   * comparisons are case-insensitive. An unset (`null`) field places no constraint on its
   * dimension; a field set to an empty list allows nothing through it.
   */
  fun matches(url: String, method: String): Boolean {
    hosts?.let { allowedHosts ->
      val host = hostOf(url)
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

  private fun hostOf(url: String): String? {
    // Parse with OkHttp's `HttpUrl`, the same engine that issued the request, so host extraction
    // matches how the request was actually routed. `java.net.URI` is stricter (RFC 2396) and
    // rejects hosts OkHttp accepts (underscores, some IDN/Unicode forms), which would silently
    // drop a request a `hosts` entry was meant to match. A URL with no parseable host yields
    // `null` and can't match any `hosts` entry.
    return url.toHttpUrlOrNull()?.host
  }
}
