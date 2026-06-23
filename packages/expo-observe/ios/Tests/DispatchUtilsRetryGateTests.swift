import Foundation
import Testing

@testable import ExpoObserve

@Suite("DispatchUtils.nextRetryGateState")
struct DispatchUtilsRetryGateTests {
  /// Fixed "now" so the expected `dispatchAfterDate` is exact rather than approximate. The
  /// helper itself never reads the system clock — `now` is always injected.
  private let now = Date(timeIntervalSince1970: 1_700_000_000)

  /// Backoff stub that returns `attempt * 10` so each test can pick the expected delay by
  /// counting from `consecutiveRetryableFailures + 1`. Avoids the random source in
  /// `computeBackoffDelay` and lets us assert exact deadlines.
  private let stubbedBackoff: (Int) -> TimeInterval = { Double($0) * 10 }

  /// `.success` is the all-clear: counter resets to 0, gate is left alone so any active
  /// gate (which shouldn't exist if we got this far, but defensively) keeps its semantics.
  @Test
  func `success resets the counter and leaves the gate alone`() {
    let state = DispatchUtils.RetryGateState(
      dispatchAfterDate: now.addingTimeInterval(60),
      consecutiveRetryableFailures: 3
    )
    let next = DispatchUtils.nextRetryGateState(
      result: .success,
      currentState: state,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(next.consecutiveRetryableFailures == 0)
    #expect(next.dispatchAfterDate == state.dispatchAfterDate)  // untouched
  }

  /// `.nonRetryable` is treated the same as success for gate purposes: a permanent drop
  /// doesn't suggest the server is unhealthy, so the counter resets and we don't introduce a
  /// new pause for subsequent batches.
  @Test
  func `nonRetryable resets the counter and leaves the gate alone`() {
    let state = DispatchUtils.RetryGateState(
      dispatchAfterDate: now.addingTimeInterval(60),
      consecutiveRetryableFailures: 2
    )
    let next = DispatchUtils.nextRetryGateState(
      result: .nonRetryable(reason: "HTTP 400"),
      currentState: state,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(next.consecutiveRetryableFailures == 0)
    #expect(next.dispatchAfterDate == state.dispatchAfterDate)
  }

  /// First retryable failure (from .initial): counter goes to 1, gate is now + backoff(1).
  /// `Retry-After` is `nil`, so we fall through to `computeBackoffDelay` (the stubbed value
  /// of 10 s here).
  @Test
  func `first retryable with no Retry-After uses computed backoff`() {
    let next = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: nil),
      currentState: .initial,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(next.consecutiveRetryableFailures == 1)
    #expect(next.dispatchAfterDate == now.addingTimeInterval(10))
  }

  /// Subsequent retryable failures: counter increments before the backoff lookup so the
  /// helper passes `nextCount` (not `currentCount`) into the backoff function. Verifies that
  /// 3rd failure → backoff(3) (= 30 s with the stub), not backoff(2).
  @Test
  func `nth retryable passes nextCount into backoff function`() {
    let state = DispatchUtils.RetryGateState(
      dispatchAfterDate: nil,
      consecutiveRetryableFailures: 2
    )
    let next = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: nil),
      currentState: state,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(next.consecutiveRetryableFailures == 3)
    #expect(next.dispatchAfterDate == now.addingTimeInterval(30))
  }

  /// Server-supplied `Retry-After` wins over the computed backoff. The backoff stub here
  /// returns 10 s for any attempt, but the explicit 90 s value should be honored.
  @Test
  func `retryable with server Retry-After uses the server delay`() {
    let next = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: 90),
      currentState: .initial,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(next.consecutiveRetryableFailures == 1)
    #expect(next.dispatchAfterDate == now.addingTimeInterval(90))
  }

  /// `Retry-After: 0` is valid and means "try again immediately." Still counts as a
  /// failure for the counter (so a misbehaving server can't suppress the exponential
  /// backoff by always responding 429 with `Retry-After: 0`) but the gate deadline equals
  /// `now`, so the next dispatch round runs without waiting.
  @Test
  func `retryable with zero Retry-After still increments counter`() {
    let next = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: 0),
      currentState: .initial,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(next.consecutiveRetryableFailures == 1)
    #expect(next.dispatchAfterDate == now)
  }

  /// Backoff function is never consulted when the server sends `Retry-After`. Verifies the
  /// server-delay branch doesn't accidentally also call into `backoff`, which would defeat
  /// the purpose of letting the server steer.
  @Test
  func `retryable with server Retry-After does not invoke the backoff function`() {
    var backoffCalled = false
    _ = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: 5),
      currentState: .initial,
      now: now,
      backoff: { _ in
        backoffCalled = true
        return 999
      }
    )
    #expect(backoffCalled == false)
  }

  /// Sequence test: 2 retryable failures then a success returns to `.initial`-equivalent
  /// state for the counter (gate is left alone, but the next attempt won't be blocked by
  /// it because the deadline is in the past by the time the next round runs).
  @Test
  func `retryable then retryable then success drives counter back to zero`() {
    let after1 = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: nil),
      currentState: .initial,
      now: now,
      backoff: stubbedBackoff
    )
    let after2 = DispatchUtils.nextRetryGateState(
      result: .retryable(retryAfter: nil),
      currentState: after1,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(after2.consecutiveRetryableFailures == 2)

    let after3 = DispatchUtils.nextRetryGateState(
      result: .success,
      currentState: after2,
      now: now,
      backoff: stubbedBackoff
    )
    #expect(after3.consecutiveRetryableFailures == 0)
  }
}
