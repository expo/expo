// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.observe

import expo.modules.appmetrics.utils.TimeUtils
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import kotlin.math.pow
import kotlin.random.Random

/**
 * Outcome of a single dispatch attempt to the OTLP endpoint. Four cases, modeled after the
 * OTLP retry guidance (see https://opentelemetry.io/docs/specs/otlp/#otlphttp-response):
 *
 * - `Success` — server accepted the batch without rejections.
 * - `PartialSuccess` — server accepted the batch but rejected some records (the OTLP
 *   `partial_success` body with `rejectedCount > 0`). The rows DID land on the server, so
 *   pending-ID removal and counter reset match `Success`; the case stays distinct so the
 *   call site can log the rejected count and `errorMessage` clearly rather than describing
 *   it as a drop.
 * - `RetryableFailure` — transient failure (429/502/503/504 or transport error); retry
 *   the same batch after `retryAfterMs` or a client-computed backoff.
 * - `NonRetryableFailure` — permanent failure (4xx/5xx outside the retryable set, encoding
 *   error); drop the batch so it can't wedge the queue.
 *
 * `RetryableFailure.retryAfterMs` carries the parsed `Retry-After` header value in
 * milliseconds (or `null` when the server didn't supply one). `NonRetryableFailure.reason`
 * carries a short diagnostic string for the warn log.
 */
sealed class DispatchResult {
  object Success : DispatchResult()
  data class PartialSuccess(val partial: OTPartialSuccess) : DispatchResult()
  data class RetryableFailure(val retryAfterMs: Long? = null) : DispatchResult()
  data class NonRetryableFailure(val reason: String) : DispatchResult()
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
      // The OTLP spec allows `partial_success` to carry a warning-only payload —
      // `rejectedCount == 0` with a non-empty `errorMessage`. Treat that as a successful send
      // (the records DID land) so we don't double-drop. When `rejectedCount > 0`, the records
      // still landed server-side but a subset was rejected; surface that as `PartialSuccess`
      // so the caller can log the count and message clearly. Pending-ID removal and gate
      // behavior for `PartialSuccess` match `Success`.
      val partial = responseBody?.takeIf { it.isNotBlank() }?.let { body ->
        runCatching {
          responseJson.decodeFromString(OTServiceResponse.serializer(), body).partialSuccess
        }.getOrNull()
      }
      if (partial != null && partial.rejectedCount > 0) {
        return DispatchResult.PartialSuccess(partial)
      }
      return DispatchResult.Success
    }

    return when (statusCode) {
      429, 502, 503, 504 -> DispatchResult.RetryableFailure(retryAfter)
      else -> {
        val excerpt = bodyExcerpt()
        val suffix = if (excerpt.isEmpty()) "" else ": $excerpt"
        DispatchResult.NonRetryableFailure(reason = "HTTP $statusCode$suffix")
      }
    }
  }

  /**
   * Whether the dispatch caller should remove the just-sent pending IDs from the queue.
   *
   * - `Success` and `PartialSuccess` remove them — the rows have been accepted by the server
   *   (partial success rejects a subset server-side, but the bytes still landed; re-sending
   *   them would just re-trip the same rejection).
   * - `NonRetryableFailure` ALSO removes them — the server has refused these rows
   *   permanently, so retrying would produce the same answer; removing them drops the batch
   *   so it can't wedge subsequent rounds. This is the acceptance-criterion behavior: a
   *   400/403 must not be re-sent on the next cycle.
   * - `RetryableFailure` keeps them so the next dispatch round picks the same rows up again.
   */
  fun shouldRemovePending(result: DispatchResult): Boolean = when (result) {
    is DispatchResult.Success,
    is DispatchResult.PartialSuccess,
    is DispatchResult.NonRetryableFailure -> true
    is DispatchResult.RetryableFailure -> false
  }

  /**
   * Parses an HTTP `Retry-After` header into a delay in milliseconds from now. Accepts both
   * formats permitted by RFC 7231: an integer delta-seconds, or an HTTP-date.
   * Returns `null` if the header is absent or unparseable, so the caller can fall through to
   * `computeBackoffDelay` for a client-driven delay.
   *
   * A successfully parsed value is clamped to `[base, cap]` so a misbehaving server can't
   * drive us to either extreme: a value below `base` (including `0`, negatives, or HTTP-dates
   * in the past) floors to `base` so we don't hammer; a value above `cap` (or a date far in
   * the future) ceilings to `cap` so we don't snooze for hours. Non-finite floating-point
   * values (`Infinity`, `NaN`) are treated as garbage and return `null`.
   */
  fun parseRetryAfter(
    header: String?,
    base: Long = backoffBaseMs,
    cap: Long = backoffCapMs
  ): Long? {
    val raw = header?.trim() ?: return null
    if (raw.isEmpty()) return null

    raw.toLongOrNull()?.let { return clampToBounds(it * 1000L, base, cap) }
    raw.toDoubleOrNull()?.let {
      if (!it.isFinite()) return null
      return clampToBounds((it * 1000L).toLong(), base, cap)
    }

    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val parsed = runCatching { formatter.parse(raw) }.getOrNull()
    if (parsed != null) {
      return clampToBounds(TimeUtils.millisUntil(parsed), base, cap)
    }
    return null
  }

  /**
   * Clamps a server-supplied retry delay into the client's `[base, cap]` window. Used by
   * `parseRetryAfter` so the gate is bounded regardless of what the server sent.
   */
  private fun clampToBounds(ms: Long, base: Long, cap: Long): Long = ms.coerceIn(base, cap)

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

  // MARK: -- Retry gate + exponential backoff

  /**
   * Base delay (in ms) for the exponential backoff when the server doesn't supply a
   * `Retry-After`. The cap (`backoffCapMs`) bounds the worst-case wait so we don't end up
   * snoozing for hours after a long string of failures.
   */
  const val backoffBaseMs: Long = 60_000L
  const val backoffCapMs: Long = 900_000L

  /**
   * Computes a backoff delay (in ms) for the next dispatch attempt when the server didn't
   * supply `Retry-After`. Exponential growth (base × 2^(attempt-1)), capped, with full jitter
   * so a fleet of devices recovering from the same transient backend outage doesn't
   * thunder-herd the recovery.
   *
   * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
   *
   * `attempt` is 1-based; the helper is defensive for `0` / negative inputs and returns 0
   * rather than producing a negative exponent.
   */
  fun computeBackoffDelay(
    attempt: Int,
    base: Long = backoffBaseMs,
    cap: Long = backoffCapMs,
    random: () -> Double = { Random.nextDouble() }
  ): Long {
    if (attempt < 1) return 0L
    val unjittered = minOf((base.toDouble() * 2.0.pow(attempt - 1)).toLong(), cap)
    return (unjittered.toDouble() * random()).toLong()
  }

  /**
   * Snapshot of the retry-gate state carried across dispatch rounds. `dispatchAfterMs` is the
   * wall-clock deadline (ms since epoch) before which the dispatch entry point should
   * short-circuit (set by a retryable response, naturally expires); `consecutiveRetryableFailures`
   * is the counter that drives `computeBackoffDelay` when the server didn't supply a
   * `Retry-After`.
   */
  data class RetryGateState(
    val dispatchAfterMs: Long?,
    val consecutiveRetryableFailures: Int
  ) {
    companion object {
      val initial = RetryGateState(dispatchAfterMs = null, consecutiveRetryableFailures = 0)
    }
  }

  /**
   * Pure helper that computes the next `RetryGateState` after a single dispatch result.
   *
   * - `Success` and `PartialSuccess` reset the counter to 0 and leave the gate alone. The
   *   gate either already expired (we wouldn't have dispatched otherwise) or was never set
   *   — either way, a server response that ACCEPTED the bytes (even if it rejected a subset
   *   server-side) doesn't introduce a new pause.
   * - `NonRetryableFailure` also resets the counter. A permanent drop isn't a sign that the
   *   server is unhealthy and shouldn't pause subsequent rounds.
   * - `RetryableFailure` increments the counter and sets the gate to `now + delay`, where
   *   `delay` is the server-supplied `retryAfterMs` if present, otherwise `backoff(nextCount)`.
   *
   * `backoff` is injected so tests can drive it deterministically without going through
   * `computeBackoffDelay`'s random source.
   */
  fun nextRetryGateState(
    result: DispatchResult,
    currentState: RetryGateState,
    now: Long,
    backoff: (Int) -> Long
  ): RetryGateState = when (result) {
    is DispatchResult.Success,
    is DispatchResult.PartialSuccess,
    is DispatchResult.NonRetryableFailure ->
      currentState.copy(consecutiveRetryableFailures = 0)
    is DispatchResult.RetryableFailure -> {
      val nextCount = currentState.consecutiveRetryableFailures + 1
      val delay = result.retryAfterMs ?: backoff(nextCount)
      RetryGateState(
        dispatchAfterMs = now + delay,
        consecutiveRetryableFailures = nextCount
      )
    }
  }
}
