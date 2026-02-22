// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("PersistentFileLog", .serialized)
struct PersistentFileLogTests {
  let log = PersistentFileLog(category: "dev.expo.modules.test.persistentlog")

  @Test
  func `cleared file has 0 entries`() async throws {
    await clearEntriesAsync(log: log)
    let entries = log.readEntries()
    #expect(entries.count == 0)
  }

  @Test
  func `append one entry works`() async throws {
    await clearEntriesAsync(log: log)
    await appendEntryAsync(log: log, entry: "Test string 1")
    let entries = log.readEntries()
    #expect(entries.count == 1)
    #expect(entries[0] == "Test string 1")
  }

  @Test
  func `append three entries works`() async throws {
    await clearEntriesAsync(log: log)
    await appendEntryAsync(log: log, entry: "Test string 1")
    await appendEntryAsync(log: log, entry: "Test string 2")
    await appendEntryAsync(log: log, entry: "Test string 3")
    let entries = log.readEntries()
    #expect(entries.count == 3)
    #expect(entries[0] == "Test string 1")
    #expect(entries[1] == "Test string 2")
  }

  @Test
  func `filter entries works`() async throws {
    await clearEntriesAsync(log: log)
    await appendEntryAsync(log: log, entry: "Test string 1")
    await appendEntryAsync(log: log, entry: "Test string 2")
    await appendEntryAsync(log: log, entry: "Test string 3")
    await filterEntriesAsync(log: log) { entry in
      entry.contains("2")
    }
    let entries = log.readEntries()
    #expect(entries.count == 1)
    #expect(entries[0] == "Test string 2")
  }

  // MARK: - Helpers

  private func clearEntriesAsync(log: PersistentFileLog) async {
    await withCheckedContinuation { continuation in
      log.clearEntries { _ in
        continuation.resume()
      }
    }
  }

  private func filterEntriesAsync(log: PersistentFileLog, filter: @escaping PersistentFileLogFilter) async {
    await withCheckedContinuation { continuation in
      log.purgeEntriesNotMatchingFilter(filter: filter) { _ in
        continuation.resume()
      }
    }
  }

  private func appendEntryAsync(log: PersistentFileLog, entry: String) async {
    await withCheckedContinuation { continuation in
      log.appendEntry(entry: entry) { _ in
        continuation.resume()
      }
    }
  }
}
