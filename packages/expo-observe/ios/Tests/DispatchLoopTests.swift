import ExpoAppMetrics
import Testing

@testable import ExpoObserve

@AppMetricsActor
@Suite("DispatchLoop")
struct DispatchLoopTests {
  private struct Row {
    let id: Int64?
  }

  private enum TestError: Error {
    case failed
  }

  @Test
  func `single batch advances to its highest id`() async {
    let state = State(rows: rows(1...3), results: [.success])

    await drain(state)

    #expect(state.sentIds == [[1, 2, 3]])
    #expect(state.persistedCursors == [3])
  }

  @Test
  func `drains multiple chunks with the configured fetch limit`() async {
    let state = State(rows: rows(1...450), results: [.success, .success, .success])

    await drain(state)

    #expect(state.sentIds.map(\.count) == [200, 200, 50])
    #expect(state.persistedCursors == [200, 400, 450])
    #expect(state.fetchLimits == [200, 200, 200, 200])
  }

  @Test
  func `partial success advances and continues`() async {
    let partial = OTPartialSuccess(rejectedDataPoints: 1, rejectedLogRecords: nil, errorMessage: nil)
    let state = State(rows: rows(1...3), results: [.partialSuccess(partial), .success], chunkSize: 2)

    await drain(state)

    #expect(state.sentIds == [[1, 2], [3]])
    #expect(state.persistedCursors == [2, 3])
  }

  @Test
  func `retryable failure on second batch keeps that cursor and stops`() async {
    let state = State(
      rows: rows(1...5),
      results: [.success, .retryableFailure(retryAfter: nil)],
      chunkSize: 2
    )

    await drain(state)

    #expect(state.sentIds == [[1, 2], [3, 4]])
    #expect(state.persistedCursors == [2])
  }

  @Test
  func `non retryable failure drops the batch and stops`() async {
    let state = State(rows: rows(1...3), results: [.nonRetryableFailure(reason: "bad")], chunkSize: 2)

    await drain(state)

    #expect(state.sentIds == [[1, 2]])
    #expect(state.persistedCursors == [2])
  }

  @Test
  func `empty fetch does not send or persist`() async {
    let state = State(rows: [], results: [])

    await drain(state)

    #expect(state.sentIds.isEmpty)
    #expect(state.persistedCursors.isEmpty)
  }

  @Test
  func `fetch error keeps the cursor`() async {
    let state = State(rows: rows(1...2), results: [.success])
    state.fetchError = .failed

    await drain(state)

    #expect(state.sentIds.isEmpty)
    #expect(state.persistedCursors.isEmpty)
  }

  @Test
  func `send error keeps the cursor and skips onResult`() async {
    let state = State(rows: rows(1...2), results: [.success])
    state.sendError = .failed

    await drain(state)

    #expect(state.persistedCursors.isEmpty)
    #expect(state.observedResults.isEmpty)
  }

  @Test
  func `nil send advances and continues without onResult`() async {
    let state = State(rows: rows(1...3), results: [nil, .success], chunkSize: 2)

    await drain(state)

    #expect(state.sentIds == [[1, 2], [3]])
    #expect(state.persistedCursors == [2, 3])
    #expect(state.observedResults.map(\.result) == [.success])
  }

  @Test
  func `payload too large halves the batch then resumes full chunks`() async {
    let state = State(
      rows: rows(1...250),
      results: [.payloadTooLarge, .success, .success],
      chunkSize: 200
    )

    await drain(state)

    #expect(state.sentIds.map(\.count) == [200, 100, 150])
    #expect(state.persistedCursors == [100, 250])
    #expect(state.fetchLimits == [200, 200, 200])
  }

  @Test
  func `retryable after halving keeps the original cursor`() async {
    let state = State(
      rows: rows(1...200),
      results: [.payloadTooLarge, .retryableFailure(retryAfter: nil)]
    )

    await drain(state)

    #expect(state.sentIds.map(\.count) == [200, 100])
    #expect(state.persistedCursors.isEmpty)
  }

  @Test
  func `repeated payload too large drops exactly one row`() async {
    let state = State(rows: rows(1...200), results: Array(repeating: .payloadTooLarge, count: 9))

    await drain(state)

    #expect(state.sentIds.map(\.count) == [200, 100, 50, 25, 12, 6, 3, 1])
    #expect(state.persistedCursors == [1])
    #expect(state.observedResults.last?.batchCount == 1)
  }

  @Test
  func `nil last row id stops without moving the cursor`() async {
    let state = State(rows: [Row(id: 1), Row(id: nil)], results: [.success])

    await drain(state)

    #expect(state.sentIds == [[1, nil]])
    #expect(state.persistedCursors.isEmpty)
  }

  @Test
  func `single row payload too large drops and stops`() async {
    let state = State(rows: rows(1...2), results: [.payloadTooLarge], chunkSize: 1)

    await drain(state)

    #expect(state.sentIds == [[1]])
    #expect(state.persistedCursors == [1])
    #expect(state.fetchLimits == [1])
  }

  private func drain(_ state: State) async {
    await DispatchLoop.drain(
      startCursor: 0,
      chunkSize: state.chunkSize,
      fetchBatch: { cursor, limit in
        state.fetchLimits.append(limit)
        if let error = state.fetchError {
          throw error
        }
        return Array(state.rows.filter { ($0.id ?? .max) > cursor }.prefix(limit))
      },
      rowId: { $0.id },
      send: { batch in
        state.sentIds.append(batch.map(\.id))
        if let error = state.sendError {
          throw error
        }
        return state.results.removeFirst()
      },
      onResult: { result, batchCount, highestId in
        state.observedResults.append((result, batchCount, highestId))
      },
      persistCursor: { state.persistedCursors.append($0) }
    )
  }

  private func rows(_ ids: ClosedRange<Int>) -> [Row] {
    return ids.map { Row(id: Int64($0)) }
  }

  private final class State {
    let rows: [Row]
    var results: [DispatchResult?]
    let chunkSize: Int
    var fetchError: TestError?
    var sendError: TestError?
    var fetchLimits: [Int] = []
    var sentIds: [[Int64?]] = []
    var persistedCursors: [Int64] = []
    var observedResults: [(result: DispatchResult, batchCount: Int, highestId: Int64)] = []

    init(rows: [Row], results: [DispatchResult?], chunkSize: Int = 200) {
      self.rows = rows
      self.results = results
      self.chunkSize = chunkSize
    }
  }
}
