package expo.modules.observe

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

/**
 * Unit tests for `DispatchUtils.nextRetryGateState`. The transition function is pure — `now`
 * is injected so the expected `dispatchAfterMs` is exact rather than approximate, and the
 * backoff function is stubbed so we can pick the expected delay by counting from the
 * pre-transition counter.
 */
class DispatchUtilsRetryGateTest {
  private val now: Long = 1_700_000_000_000L

  /// Backoff stub that returns `attempt * 10` so each test can pick the expected delay by
  /// counting from `consecutiveRetryableFailures + 1`. Avoids the random source in
  /// `computeBackoffDelay` and lets us assert exact deadlines.
  private val stubbedBackoff: (Int) -> Long = { (it * 10).toLong() }

  /// `Success` is the all-clear: counter resets to 0, gate is left alone so any active gate
  /// (which shouldn't exist if we got this far, but defensively) keeps its semantics.
  @Test
  fun `Success resets the counter and leaves the gate alone`() {
    val state = DispatchUtils.RetryGateState(
      dispatchAfterMs = now + 60_000L,
      consecutiveRetryableFailures = 3
    )
    val next = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Success,
      currentState = state,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(0, next.consecutiveRetryableFailures)
    assertEquals(state.dispatchAfterMs, next.dispatchAfterMs)  // untouched
  }

  /// `NonRetryable` is treated the same as success for gate purposes: a permanent drop
  /// doesn't suggest the server is unhealthy, so the counter resets and we don't introduce a
  /// new pause for subsequent batches.
  @Test
  fun `NonRetryable resets the counter and leaves the gate alone`() {
    val state = DispatchUtils.RetryGateState(
      dispatchAfterMs = now + 60_000L,
      consecutiveRetryableFailures = 2
    )
    val next = DispatchUtils.nextRetryGateState(
      result = DispatchResult.NonRetryable("HTTP 400"),
      currentState = state,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(0, next.consecutiveRetryableFailures)
    assertEquals(state.dispatchAfterMs, next.dispatchAfterMs)
  }

  /// First retryable failure (from `.initial`): counter goes to 1, gate is `now + backoff(1)`.
  /// `retryAfterMs` is `null`, so we fall through to `computeBackoffDelay` (the stubbed value
  /// of 10 here).
  @Test
  fun `first retryable with no Retry-After uses computed backoff`() {
    val next = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(),
      currentState = DispatchUtils.RetryGateState.initial,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(1, next.consecutiveRetryableFailures)
    assertEquals(now + 10L, next.dispatchAfterMs)
  }

  /// Subsequent retryable failures: counter increments before the backoff lookup so the
  /// helper passes `nextCount` (not `currentCount`) into the backoff function. Verifies that
  /// 3rd failure → backoff(3) (= 30 with the stub), not backoff(2).
  @Test
  fun `nth retryable passes nextCount into backoff function`() {
    val state = DispatchUtils.RetryGateState(
      dispatchAfterMs = null,
      consecutiveRetryableFailures = 2
    )
    val next = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(),
      currentState = state,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(3, next.consecutiveRetryableFailures)
    assertEquals(now + 30L, next.dispatchAfterMs)
  }

  /// Server-supplied `retryAfterMs` wins over the computed backoff. The backoff stub here
  /// returns small values, but the explicit 90_000 ms value should be honored.
  @Test
  fun `retryable with server Retry-After uses the server delay`() {
    val next = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(retryAfterMs = 90_000L),
      currentState = DispatchUtils.RetryGateState.initial,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(1, next.consecutiveRetryableFailures)
    assertEquals(now + 90_000L, next.dispatchAfterMs)
  }

  /// `retryAfterMs: 0L` is valid and means "try again immediately." Still counts as a
  /// failure for the counter (so a misbehaving server can't suppress the exponential backoff
  /// by always responding 429 with `Retry-After: 0`) but the gate deadline equals `now`, so
  /// the next dispatch round runs without waiting.
  @Test
  fun `retryable with zero Retry-After still increments counter`() {
    val next = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(retryAfterMs = 0L),
      currentState = DispatchUtils.RetryGateState.initial,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(1, next.consecutiveRetryableFailures)
    assertEquals(now, next.dispatchAfterMs)
  }

  /// Backoff function is never consulted when the server sends `Retry-After`. Verifies the
  /// server-delay branch doesn't accidentally also call into `backoff`, which would defeat
  /// the purpose of letting the server steer.
  @Test
  fun `retryable with server Retry-After does not invoke the backoff function`() {
    var backoffCalled = false
    DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(retryAfterMs = 5_000L),
      currentState = DispatchUtils.RetryGateState.initial,
      now = now,
      backoff = {
        backoffCalled = true
        999L
      }
    )
    assertFalse(backoffCalled)
  }

  /// Sequence test: 2 retryable failures then a success returns the counter to zero. The
  /// gate from the second failure is left in place (it will naturally expire by the time the
  /// next dispatch round happens).
  @Test
  fun `retryable then retryable then success drives counter back to zero`() {
    val after1 = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(),
      currentState = DispatchUtils.RetryGateState.initial,
      now = now,
      backoff = stubbedBackoff
    )
    val after2 = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Retryable(),
      currentState = after1,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(2, after2.consecutiveRetryableFailures)

    val after3 = DispatchUtils.nextRetryGateState(
      result = DispatchResult.Success,
      currentState = after2,
      now = now,
      backoff = stubbedBackoff
    )
    assertEquals(0, after3.consecutiveRetryableFailures)
  }
}
