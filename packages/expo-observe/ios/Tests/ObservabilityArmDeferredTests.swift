import Foundation
import Testing

@testable import ExpoObserve

@Suite("ObservabilityManager.computeNextDeferredArm")
struct ComputeNextDeferredArmTests {
  private let delay: TimeInterval = 1800
  private let armedAt = Date(timeIntervalSince1970: 1000)

  @Test
  func `first arm: no existing state schedules for now + delay`() {
    let next = ObservabilityManager.computeNextDeferredArm(
      now: armedAt,
      delay: delay,
      existing: nil
    )
    #expect(next.fireTime == armedAt.addingTimeInterval(delay))
    #expect(next.originalArmTime == armedAt)
  }

  @Test
  func `re-arm: pushes existing fire time by delay over two`() {
    let existing = DeferredArmState(
      fireTime: armedAt.addingTimeInterval(delay),
      originalArmTime: armedAt
    )
    let pollAt = armedAt.addingTimeInterval(60)
    let next = ObservabilityManager.computeNextDeferredArm(
      now: pollAt,
      delay: delay,
      existing: existing
    )
    // Pushed = 1800 + 900 = 2700; cap = originalArm + 2 * 1800 = 3600. Uncapped.
    #expect(next.fireTime == armedAt.addingTimeInterval(delay + delay / 2))
    // originalArmTime is preserved across re-arms so the cap remains anchored to the first arm.
    #expect(next.originalArmTime == armedAt)
  }

  @Test
  func `re-arm: fire time at the cap stays at the cap`() {
    // Existing fire time already equals originalArm + 2 × delay; pushing further would exceed
    // the cap. The cap clamps it back so further polls don't extend the timer.
    let cappedFire = armedAt.addingTimeInterval(2 * delay)
    let existing = DeferredArmState(fireTime: cappedFire, originalArmTime: armedAt)
    let next = ObservabilityManager.computeNextDeferredArm(
      now: armedAt.addingTimeInterval(60),
      delay: delay,
      existing: existing
    )
    #expect(next.fireTime == cappedFire)
    #expect(next.originalArmTime == armedAt)
  }

  @Test
  func `re-arm: push that would land beyond the cap is clamped`() {
    // 100 seconds shy of the cap (3600 - 100 = 3500). Pushed = 3500 + 900 = 4400 > 3600 → cap.
    let existing = DeferredArmState(
      fireTime: armedAt.addingTimeInterval(2 * delay - 100),
      originalArmTime: armedAt
    )
    let next = ObservabilityManager.computeNextDeferredArm(
      now: armedAt.addingTimeInterval(60),
      delay: delay,
      existing: existing
    )
    #expect(next.fireTime == armedAt.addingTimeInterval(2 * delay))
    #expect(next.originalArmTime == armedAt)
  }

  @Test
  func `re-arm: push that lands exactly at the cap is unclamped`() {
    // existing fire = originalArm + 1.5 × delay = 2700. Pushed = 2700 + 900 = 3600 = cap.
    // min(pushed, cap) == cap, so the result equals the cap exactly.
    let existing = DeferredArmState(
      fireTime: armedAt.addingTimeInterval(delay + delay / 2),
      originalArmTime: armedAt
    )
    let next = ObservabilityManager.computeNextDeferredArm(
      now: armedAt.addingTimeInterval(60),
      delay: delay,
      existing: existing
    )
    #expect(next.fireTime == armedAt.addingTimeInterval(2 * delay))
  }

  @Test
  func `re-arm: existing fire time already passed counts as first arm`() {
    // If the existing state describes a deadline in the past, the timer has already fired (or is
    // about to) and the state is stale — treat the new arm as fresh, restarting the cap window
    // from the new poll time.
    let existing = DeferredArmState(
      fireTime: armedAt.addingTimeInterval(-1),
      originalArmTime: armedAt
    )
    let pollAt = armedAt.addingTimeInterval(60)
    let next = ObservabilityManager.computeNextDeferredArm(
      now: pollAt,
      delay: delay,
      existing: existing
    )
    #expect(next.fireTime == pollAt.addingTimeInterval(delay))
    #expect(next.originalArmTime == pollAt)
  }

  @Test
  func `re-arm: existing fire time exactly equal to now counts as first arm`() {
    // `existing.fireTime > now` is the gate; `==` falls through to the first-arm branch.
    let existing = DeferredArmState(fireTime: armedAt, originalArmTime: armedAt)
    let next = ObservabilityManager.computeNextDeferredArm(
      now: armedAt,
      delay: delay,
      existing: existing
    )
    #expect(next.fireTime == armedAt.addingTimeInterval(delay))
    #expect(next.originalArmTime == armedAt)
  }

  @Test
  func `delay zero: first arm fires immediately and cap collapses`() {
    let next = ObservabilityManager.computeNextDeferredArm(
      now: armedAt,
      delay: 0,
      existing: nil
    )
    #expect(next.fireTime == armedAt)
    #expect(next.originalArmTime == armedAt)
  }
}

@Suite("ObservabilityManager.shouldArmDeferred")
struct ShouldArmDeferredTests {
  @Test
  func `no new metrics and no new logs returns false`() {
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { 10 },
      readMaxLogId: { 5 }
    )
    #expect(result == false)
  }

  @Test
  func `new metrics returns true`() {
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { 11 },
      readMaxLogId: { 5 }
    )
    #expect(result == true)
  }

  @Test
  func `new logs returns true`() {
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { 10 },
      readMaxLogId: { 6 }
    )
    #expect(result == true)
  }

  @Test
  func `both signals new returns true`() {
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { 99 },
      readMaxLogId: { 99 }
    )
    #expect(result == true)
  }

  @Test
  func `nil max ids treated as no new rows`() {
    // Empty tables — `getMaxMetricId`/`getMaxLogId` return `nil`. Polling must not arm in this
    // case, otherwise a fresh install would dispatch on every poll.
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { nil },
      readMaxLogId: { nil }
    )
    #expect(result == false)
  }

  @Test
  func `metric reader throwing falls back to false for that signal`() {
    // A transient DB read failure on the metrics side must not arm the timer for "phantom" new
    // rows. Logs still drive the decision.
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { throw ShouldArmDeferredTestsError.boom },
      readMaxLogId: { 5 }
    )
    #expect(result == false)
  }

  @Test
  func `logs reader throwing leaves metrics signal authoritative`() {
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { 11 },
      readMaxLogId: { throw ShouldArmDeferredTestsError.boom }
    )
    #expect(result == true)
  }

  @Test
  func `metric cursor equal to max id is not new`() {
    // The gate is strict `>`, not `>=`. Cursor sitting at max means the last batch was already
    // dispatched.
    let result = ObservabilityManager.shouldArmDeferred(
      metricCursor: 10,
      logCursor: 5,
      readMaxMetricId: { 10 },
      readMaxLogId: { 5 }
    )
    #expect(result == false)
  }
}

private enum ShouldArmDeferredTestsError: Error {
  case boom
}
