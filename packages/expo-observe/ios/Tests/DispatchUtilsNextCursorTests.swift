import Foundation
import Testing

@testable import ExpoObserve

@Suite("DispatchUtils.nextCursor")
struct DispatchUtilsNextCursorTests {
  /// On `.success`, the cursor must advance past the dispatched batch so the next round reads
  /// only newer rows. This is unchanged from the pre-OTLP-spec behavior; covered here to lock
  /// the contract for the table-driven `nonRetryable` case.
  @Test
  func `success advances cursor to highestId`() {
    let next = DispatchUtils.nextCursor(
      for: .success,
      currentCursor: 10,
      highestId: 20
    )
    #expect(next == 20)
  }

  /// `.retryable` is the "leave it alone" case — the next dispatch round picks the same rows
  /// up again. This is what keeps an in-flight outage from losing telemetry.
  @Test
  func `retryable retains current cursor`() {
    let next = DispatchUtils.nextCursor(
      for: .retryable(retryAfter: nil),
      currentCursor: 10,
      highestId: 20
    )
    #expect(next == 10)
  }

  /// Retry-After value doesn't change the cursor decision — it only influences WHEN the next
  /// attempt happens (gate logic lands in commit C1), not WHICH rows it covers.
  @Test
  func `retryable with Retry-After still retains current cursor`() {
    let next = DispatchUtils.nextCursor(
      for: .retryable(retryAfter: 30),
      currentCursor: 10,
      highestId: 20
    )
    #expect(next == 10)
  }

  /// The acceptance-criterion behavior: a non-retryable response (e.g. 400, 403) advances the
  /// cursor past the offending batch. Without this, the next round would re-send the same rows
  /// and the server would refuse them again, wedging the loop indefinitely.
  @Test
  func `nonRetryable advances cursor to highestId`() {
    let next = DispatchUtils.nextCursor(
      for: .nonRetryable(reason: "HTTP 400"),
      currentCursor: 10,
      highestId: 20
    )
    #expect(next == 20)
  }

  /// Edge case: a single-row batch where `currentCursor + 1 == highestId`. The cursor still
  /// advances exactly once on `.nonRetryable` so the bad row is consumed.
  @Test
  func `nonRetryable on single-row batch advances by one`() {
    let next = DispatchUtils.nextCursor(
      for: .nonRetryable(reason: "HTTP 400"),
      currentCursor: 41,
      highestId: 42
    )
    #expect(next == 42)
  }

  /// Sanity check: `.success` on an empty-batch reply (highestId == currentCursor) is a no-op
  /// move. We don't filter this case out at the cursor layer — the dispatch site already
  /// short-circuits empty batches before calling `nextCursor`.
  @Test
  func `success with highestId equal to currentCursor leaves cursor unchanged`() {
    let next = DispatchUtils.nextCursor(
      for: .success,
      currentCursor: 10,
      highestId: 10
    )
    #expect(next == 10)
  }
}
