import Foundation
import Testing

@testable import ExpoObserve

@Suite("DispatchUtils.computeBackoffDelay")
struct DispatchUtilsBackoffTests {
  private let base: TimeInterval = 60
  private let cap: TimeInterval = 900

  /// Attempt 1 with no jitter (random=0) is the zero floor of the exponential schedule.
  /// Attempt 1 with full jitter (random near 1.0) is the unjittered base interval. Together
  /// these prove the jitter range is `[0, base * 2^(attempt-1))`.
  @Test
  func `attempt one jitter zero is zero`() {
    let delay = DispatchUtils.computeBackoffDelay(
      attempt: 1,
      base: base,
      cap: cap,
      random: { 0 }
    )
    #expect(delay == 0)
  }

  @Test
  func `attempt one jitter near max approaches base`() {
    let delay = DispatchUtils.computeBackoffDelay(
      attempt: 1,
      base: base,
      cap: cap,
      random: { 0.999 }
    )
    #expect(delay > base * 0.99)
    #expect(delay < base)  // strict — `random(in: 0..<1)` excludes 1
  }

  /// The exponential schedule doubles between attempts: attempt 2 reaches 2 × base, attempt
  /// 3 reaches 4 × base, …, all multiplied by the jitter draw.
  @Test
  func `attempts two through four double the unjittered ceiling`() {
    let r: () -> Double = { 0.5 }  // pin jitter to exactly half
    let two = DispatchUtils.computeBackoffDelay(attempt: 2, base: base, cap: cap, random: r)
    let three = DispatchUtils.computeBackoffDelay(attempt: 3, base: base, cap: cap, random: r)
    let four = DispatchUtils.computeBackoffDelay(attempt: 4, base: base, cap: cap, random: r)
    #expect(two == base * 2 * 0.5)  //  60
    #expect(three == base * 4 * 0.5)  // 120
    #expect(four == base * 8 * 0.5)  // 240
  }

  /// Once `base * 2^(attempt-1)` would exceed `cap`, the unjittered ceiling clamps to `cap`.
  /// Verified with attempt 5 (would be 16 × 60 = 960 > 900) and a very large attempt count.
  @Test
  func `attempt above cap threshold clamps to cap times jitter`() {
    // attempt 5 → 60 × 16 = 960; cap = 900 → ceiling clamps to 900, jitter 0.5 → 450.
    let delay = DispatchUtils.computeBackoffDelay(
      attempt: 5,
      base: base,
      cap: cap,
      random: { 0.5 }
    )
    #expect(delay == cap * 0.5)
  }

  @Test
  func `very large attempt count still respects cap`() {
    // 2^29 × 60 is astronomical; the cap must clamp it before the jitter draw.
    let delay = DispatchUtils.computeBackoffDelay(
      attempt: 30,
      base: base,
      cap: cap,
      random: { 1.0 }
    )
    #expect(delay <= cap)
  }

  @Test
  func `attempt zero returns zero defensively`() {
    // 1-based attempt counter; attempt 0 would be a logic error elsewhere. Don't produce a
    // negative exponent — just return 0 so the caller's gate is set to "now" and the next
    // round can dispatch immediately.
    let delay = DispatchUtils.computeBackoffDelay(
      attempt: 0,
      base: base,
      cap: cap,
      random: { 1.0 }
    )
    #expect(delay == 0)
  }

  @Test
  func `negative attempt returns zero defensively`() {
    let delay = DispatchUtils.computeBackoffDelay(
      attempt: -5,
      base: base,
      cap: cap,
      random: { 1.0 }
    )
    #expect(delay == 0)
  }
}
