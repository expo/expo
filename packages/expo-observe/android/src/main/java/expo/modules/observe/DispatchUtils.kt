// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.observe

import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Outcome of a single dispatch attempt to the OTLP endpoint. Modeled after the OTLP retry
 * guidance: a 3-way classification distinguishes transient failures (retry the same batch)
 * from permanent ones (drop the batch so it can't wedge the queue).
 *
 * `Retryable.retryAfterMs` carries the parsed `Retry-After` header value in milliseconds (or
 * `null` when the server didn't supply one). `NonRetryable.reason` carries a short diagnostic
 * string for the `warn`-level log line.
 */
sealed class DispatchResult {
  object Success : DispatchResult()
  data class Retryable(val retryAfterMs: Long? = null) : DispatchResult()
  data class NonRetryable(val reason: String) : DispatchResult()
}

/**
 * HTTP response classification + Retry-After parsing for `EventDispatcher`. Lives in its own
 * file mirroring `DispatchUtils.swift` on the iOS side. All functions are pure so they can be
 * unit-tested without instantiating the dispatcher or hitting the network.
 */
object DispatchUtils {
  /**
   * Pure classifier that maps an HTTP response into one of three retry outcomes. Extracted
   * from the dispatch call site so the OTLP-spec rules can be unit-tested without a real
   * network call.
   *
   * `bodyExcerpt` is invoked lazily, only when the result is `NonRetryable` and the reason
   * string benefits from including a peek at the response body. Lets the caller bound how
   * much data we slurp into the log line.
   */
  fun classifyResponse(
    statusCode: Int,
    retryAfterHeader: String?,
    responseBody: String?,
    bodyExcerpt: () -> String = { "" }
  ): DispatchResult {
    val retryAfter = parseRetryAfter(retryAfterHeader)

    if (statusCode in 200..299) {
      // The OTLP spec also allows `partial_success` to carry a warning-only payload —
      // `rejectedCount == 0` with a non-empty `errorMessage`. Treat that as a successful send
      // (the records DID land) so we don't double-drop. The caller may still want to log the
      // warning.
      val partial = responseBody?.let { parsePartialSuccess(it) }
      if (partial != null && partial.rejectedCount > 0) {
        val detail = partial.errorMessage ?: "no error message"
        return DispatchResult.NonRetryable(
          reason = "partial_success: rejected ${partial.rejectedCount} ($detail)"
        )
      }
      return DispatchResult.Success
    }

    return when (statusCode) {
      408, 429, 502, 503, 504 -> DispatchResult.Retryable(retryAfter)
      else -> {
        val excerpt = bodyExcerpt()
        val suffix = if (excerpt.isEmpty()) "" else ": $excerpt"
        DispatchResult.NonRetryable(reason = "HTTP $statusCode$suffix")
      }
    }
  }

  /**
   * Parses an HTTP `Retry-After` header into a delay in milliseconds from now. Accepts both
   * formats permitted by RFC 7231: an integer delta-seconds, or an HTTP-date.
   * Returns `null` if the header is absent or unparseable. Clamps negative / past values to 0
   * so a misbehaving server can't make us schedule the next dispatch in the past.
   */
  fun parseRetryAfter(header: String?, now: Long = System.currentTimeMillis()): Long? {
    val raw = header?.trim() ?: return null
    if (raw.isEmpty()) return null

    raw.toLongOrNull()?.let { return maxOf(it * 1000L, 0L) }
    raw.toDoubleOrNull()?.let { return maxOf((it * 1000L).toLong(), 0L) }

    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val parsed = runCatching { formatter.parse(raw) }.getOrNull()
    if (parsed != null) {
      return maxOf(parsed.time - now, 0L)
    }
    return null
  }

  /**
   * First `limit` bytes of the response body, for inclusion in error log lines. Bounded so a
   * giant HTML error page doesn't flood the log; truncated mid-codepoint is acceptable for a
   * diagnostic excerpt.
   */
  internal fun bodyExcerpt(body: String?, limit: Int = 512): String {
    if (body.isNullOrEmpty()) return ""
    return if (body.length <= limit) body else body.substring(0, limit)
  }

  private val responseJson = Json { ignoreUnknownKeys = true }

  private fun parsePartialSuccess(body: String): OTPartialSuccess? {
    if (body.isBlank()) return null
    return runCatching {
      responseJson.decodeFromString(OTServiceResponse.serializer(), body).partialSuccess
    }.getOrNull()
  }
}
