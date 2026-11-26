import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("PendingErrorStore")
struct PendingErrorStoreTests {
  @Test
  func `revoke removes a fatal error whose write is in progress`() throws {
    try withTemporaryDirectory { directory in
      let writing = DispatchSemaphore(value: 0)
      let resume = DispatchSemaphore(value: 0)
      let finished = DispatchGroup()
      let deleting = DispatchSemaphore(value: 0)
      let deleted = DispatchSemaphore(value: 0)
      DispatchQueue.global().async(group: finished) {
        PendingErrorStore.write(makePendingError(message: "fatal", sessionId: "s")) {
          writing.signal()
          _ = resume.wait(timeout: .now() + 5)
          try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
          return directory
        }
      }
      #expect(writing.wait(timeout: .now() + 5) == .success)
      DispatchQueue.global().async(group: finished) {
        deleting.signal()
        PendingErrorStore.delete(in: directory)
        deleted.signal()
      }
      #expect(deleting.wait(timeout: .now() + 5) == .success)
      _ = deleted.wait(timeout: .now() + 0.2)
      resume.signal()
      #expect(finished.wait(timeout: .now() + 5) == .success)
      #expect(!FileManager.default.fileExists(atPath: directory.path))
    }
  }

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
        makePendingError(message: "first", sessionId: "s", timestamp: "2026-01-01T00:00:01Z"),
        in: directory
      )
      PendingErrorStore.write(
        makePendingError(message: "second", sessionId: "s", timestamp: "2026-01-01T00:00:02Z"),
        in: directory
      )

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
