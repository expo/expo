import ExpoAppMetrics
import Testing

@testable import ExpoObserve

@AppMetricsActor
@Suite("SpanDispatchLoop")
struct SpanDispatchLoopTests {
  /// Records what the loop sent and deleted so each outcome can be asserted end to end.
  private final class Recorder {
    var sentIds: [[Int64?]] = []
    var deletedIds: [Int64?] = []
    var fetchCursors: [Int64] = []
    var results: [DispatchResult?]
    var sendError: Error?
    var fetchError: Error?

    init(results: [DispatchResult?]) {
      self.results = results
    }
  }

  private enum TestError: Error {
    case failed
  }

  @Test
  func `an empty table sends nothing and deletes nothing`() async {
    let recorder = Recorder(results: [])
    await drain(rows: [], recorder: recorder)
    #expect(recorder.sentIds.isEmpty)
    #expect(recorder.deletedIds.isEmpty)
  }

  @Test
  func `a successful chunk is deleted up to its highest id`() async {
    let recorder = Recorder(results: [.success])
    await drain(rows: rows(1...3), recorder: recorder)
    #expect(recorder.sentIds == [[1, 2, 3]])
    #expect(recorder.deletedIds == [3])
  }

  @Test
  func `a backlog goes out as sequential chunks`() async {
    let recorder = Recorder(results: [.success, .success, .success])
    await drain(rows: rows(1...5), recorder: recorder, chunkSize: 2)
    #expect(recorder.sentIds == [[1, 2], [3, 4], [5]])
    #expect(recorder.deletedIds == [2, 4, 5])
  }

  @Test
  func `a retryable failure keeps every remaining row and stops`() async {
    // The table is the queue, so leaving the rows is the only way the next dispatch finds them.
    let recorder = Recorder(results: [.success, .retryableFailure(retryAfter: nil)])
    await drain(rows: rows(1...6), recorder: recorder, chunkSize: 2)
    #expect(recorder.sentIds == [[1, 2], [3, 4]])
    #expect(recorder.deletedIds == [2])
  }

  @Test
  func `a non-retryable failure drops its chunk and continues`() async {
    // Unlike metrics and logs, spans keep going: the next chunk may well be fine, and there is
    // no cursor whose ordering would be violated.
    let recorder = Recorder(results: [.nonRetryableFailure(reason: "bad"), .success])
    await drain(rows: rows(1...4), recorder: recorder, chunkSize: 2)
    #expect(recorder.sentIds == [[1, 2], [3, 4]])
    #expect(recorder.deletedIds == [2, 4])
  }

  @Test
  func `partial success deletes the chunk including the rejected rows`() async {
    // A rejection is permanent (a malformed id, a session id that is not a UUID), so resending
    // the same bytes would fail identically.
    let partial = OTPartialSuccess(
      rejectedDataPoints: nil,
      rejectedLogRecords: nil,
      rejectedSpans: 2,
      errorMessage: "2 invalid spans"
    )
    let recorder = Recorder(results: [.partialSuccess(partial)])
    await drain(rows: rows(1...3), recorder: recorder)
    #expect(recorder.deletedIds == [3])
  }

  @Test
  func `an oversized chunk is halved and both halves are sent`() async {
    let recorder = Recorder(results: [.payloadTooLarge, .success, .success])
    await drain(rows: rows(1...4), recorder: recorder)
    #expect(recorder.sentIds == [[1, 2, 3, 4], [1, 2], [3, 4]])
    #expect(recorder.deletedIds == [2, 4])
  }

  @Test
  func `halving repeats until a single span is left, which is dropped`() async {
    // 4 -> 2 -> 1. The last row cannot be split, so it is dropped rather than blocking the
    // three rows behind it forever.
    let recorder = Recorder(results: Array(repeating: .payloadTooLarge, count: 8))
    await drain(rows: rows(1...4), recorder: recorder)
    #expect(recorder.sentIds.map(\.count) == [4, 2, 1, 1, 2, 1, 1])
    #expect(recorder.deletedIds == [1, 2, 3, 4])
  }

  @Test
  func `a retryable failure after halving keeps the whole original chunk`() async {
    let recorder = Recorder(results: [.payloadTooLarge, .retryableFailure(retryAfter: nil)])
    await drain(rows: rows(1...4), recorder: recorder)
    #expect(recorder.sentIds == [[1, 2, 3, 4], [1, 2]])
    #expect(recorder.deletedIds.isEmpty)
  }

  @Test
  func `a chunk with nothing to send is still deleted`() async {
    // Every session row was pruned, so the spans carry no resource metadata and can never be
    // sent. They are deleted instead of being read again on every dispatch.
    let recorder = Recorder(results: [nil, .success])
    await drain(rows: rows(1...4), recorder: recorder, chunkSize: 2)
    #expect(recorder.sentIds == [[1, 2], [3, 4]])
    #expect(recorder.deletedIds == [2, 4])
  }

  @Test
  func `reads one chunk at a time rather than the whole backlog`() async {
    // Each row carries attribute and event JSON, and this runs on resign-active, so the resident
    // set must stay at one chunk. Re-reading also picks up spans inserted during a long drain.
    let recorder = Recorder(results: [.success, .success, .success])
    await drain(rows: rows(1...5), recorder: recorder, chunkSize: 2)
    #expect(recorder.sentIds == [[1, 2], [3, 4], [5]])
    // Cursor advances past each delivered chunk, and one final read returns empty to stop.
    #expect(recorder.fetchCursors == [-1, 2, 4, 5])
  }

  @Test
  func `a fetch that throws stops without sending`() async {
    let recorder = Recorder(results: [.success])
    recorder.fetchError = TestError.failed
    await drain(rows: rows(1...3), recorder: recorder)
    #expect(recorder.sentIds.isEmpty)
    #expect(recorder.deletedIds.isEmpty)
  }

  @Test
  func `a send that throws drops its chunk and continues`() async {
    // Assembly failed rather than the request. Keeping the rows would pin them until the insert
    // cap evicted them if the cause is persistent (a corrupt database), blocking every span
    // behind them, so the chunk is dropped. Android collapses the same condition into a
    // non-retryable failure, which also drops.
    let recorder = Recorder(results: [.success])
    recorder.sendError = TestError.failed
    await drain(rows: rows(1...3), recorder: recorder, chunkSize: 2)
    #expect(recorder.deletedIds == [2, 3])
  }

  @Test
  func `every outcome maps to a disposition`() {
    let partial = OTPartialSuccess(
      rejectedDataPoints: nil,
      rejectedLogRecords: nil,
      rejectedSpans: 1,
      errorMessage: nil
    )
    #expect(SpanDispatchLoop.disposition(for: .success, chunkCount: 2) == .deleteAndContinue)
    #expect(SpanDispatchLoop.disposition(for: .partialSuccess(partial), chunkCount: 2) == .deleteAndContinue)
    #expect(SpanDispatchLoop.disposition(for: .nonRetryableFailure(reason: "x"), chunkCount: 2) == .deleteAndContinue)
    #expect(SpanDispatchLoop.disposition(for: .retryableFailure(retryAfter: nil), chunkCount: 2) == .keepAndStop)
    #expect(SpanDispatchLoop.disposition(for: .payloadTooLarge, chunkCount: 2) == nil)
    #expect(SpanDispatchLoop.disposition(for: .payloadTooLarge, chunkCount: 1) == .deleteAndContinue)
  }

  private func drain(rows: [SpanRow], recorder: Recorder, chunkSize: Int = 512) async {
    await SpanDispatchLoop.drain(
      chunkSize: chunkSize,
      fetchChunk: { afterId, limit in
        recorder.fetchCursors.append(afterId)
        if let error = recorder.fetchError {
          throw error
        }
        return Array(rows.filter { ($0.id ?? .max) > afterId }.prefix(limit))
      },
      send: { chunk in
        recorder.sentIds.append(chunk.map(\.id))
        if let error = recorder.sendError {
          throw error
        }
        return recorder.results.isEmpty ? .success : recorder.results.removeFirst()
      },
      deleteUpTo: { recorder.deletedIds.append($0) }
    )
  }

  private func rows(_ ids: ClosedRange<Int64>) -> [SpanRow] {
    return ids.map { id in
      return SpanRow(
        id: id,
        sessionId: "s",
        name: "GET",
        kind: SpanRow.clientKind,
        startTimestampMs: 1_782_131_895_000,
        endTimestampMs: 1_782_131_895_250
      )
    }
  }
}
