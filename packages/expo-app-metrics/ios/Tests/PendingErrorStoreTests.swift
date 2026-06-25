import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("PendingErrorStore")
struct PendingErrorStoreTests {
  @Test
  func `writes and drains a fatal error round-trip`() throws {
    try withTemporaryDirectory { directory in
      let error = makePendingError(message: "boom", sessionId: "session-1")
      PendingErrorStore.write(error, in: directory)

      let drained = PendingErrorStore.drain(in: directory)
      #expect(drained.count == 1)
      #expect(drained[0].message == "boom")
      #expect(drained[0].sessionId == "session-1")
      #expect(drained[0].source == "global")
    }
  }

  @Test
  func `drain removes the files so a second drain is empty`() throws {
    try withTemporaryDirectory { directory in
      PendingErrorStore.write(makePendingError(message: "once", sessionId: "s"), in: directory)
      #expect(PendingErrorStore.drain(in: directory).count == 1)
      #expect(PendingErrorStore.drain(in: directory).isEmpty)
    }
  }

  @Test
  func `drains multiple errors oldest-first by timestamp`() throws {
    try withTemporaryDirectory { directory in
      PendingErrorStore.write(
        makePendingError(message: "first", sessionId: "s", timestamp: "2026-01-01T00:00:01Z"), in: directory)
      PendingErrorStore.write(
        makePendingError(message: "second", sessionId: "s", timestamp: "2026-01-01T00:00:02Z"), in: directory)

      let drained = PendingErrorStore.drain(in: directory)
      #expect(drained.map(\.message) == ["first", "second"])
    }
  }

  @Test
  func `skips and deletes a corrupt file`() throws {
    try withTemporaryDirectory { directory in
      PendingErrorStore.write(makePendingError(message: "valid", sessionId: "s"), in: directory)
      // A malformed JSON file alongside the valid one.
      let corruptUrl = directory.appendingPathComponent("2026-01-01T00:00:00Z-corrupt.json")
      try "not json".data(using: .utf8)!.write(to: corruptUrl)

      let drained = PendingErrorStore.drain(in: directory)
      #expect(drained.map(\.message) == ["valid"])
      // The corrupt file is removed too, so it never wedges future drains.
      #expect(!FileManager.default.fileExists(atPath: corruptUrl.path))
    }
  }
}

private func makePendingError(
  message: String,
  sessionId: String,
  timestamp: String = "2026-01-01T00:00:00Z"
) -> PendingErrorStore.PendingError {
  return PendingErrorStore.PendingError(
    source: "global",
    type: "Error",
    message: message,
    stacktrace: "at f (app.js:1:1)",
    sessionId: sessionId,
    timestamp: timestamp
  )
}

private func withTemporaryDirectory(_ body: (URL) throws -> Void) throws {
  let directory = FileManager.default.temporaryDirectory
    .appendingPathComponent("PendingErrorStoreTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  defer {
    try? FileManager.default.removeItem(at: directory)
  }
  try body(directory)
}
