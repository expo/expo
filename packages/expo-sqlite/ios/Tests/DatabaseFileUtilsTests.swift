// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoSQLite

@Suite("DatabaseFileUtils")
final class DatabaseFileUtilsTests {
  private let tempDir: URL

  init() throws {
    tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
  }

  deinit {
    try? FileManager.default.removeItem(at: tempDir)
  }

  private func createFile(_ name: String) -> String {
    let path = tempDir.appendingPathComponent(name).path
    FileManager.default.createFile(atPath: path, contents: Data("data".utf8))
    return path
  }

  @Test
  func `deletes the main database file`() throws {
    let dbPath = createFile("test.db")

    try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)

    #expect(!FileManager.default.fileExists(atPath: dbPath))
  }

  @Test
  func `deletes journal wal and shm sidecar files along with the database`() throws {
    let dbPath = createFile("test.db")
    let journalPath = createFile("test.db-journal")
    let walPath = createFile("test.db-wal")
    let shmPath = createFile("test.db-shm")

    try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)

    #expect(!FileManager.default.fileExists(atPath: dbPath))
    #expect(!FileManager.default.fileExists(atPath: journalPath))
    #expect(!FileManager.default.fileExists(atPath: walPath))
    #expect(!FileManager.default.fileExists(atPath: shmPath))
  }

  @Test
  func `keeps unrelated files intact`() throws {
    let dbPath = createFile("test.db")
    let otherDbPath = createFile("test2.db")
    let otherWalPath = createFile("test2.db-wal")

    try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)

    #expect(!FileManager.default.fileExists(atPath: dbPath))
    #expect(FileManager.default.fileExists(atPath: otherDbPath))
    #expect(FileManager.default.fileExists(atPath: otherWalPath))
  }

  @Test
  func `throws when the main database file does not exist`() {
    let dbPath = tempDir.appendingPathComponent("missing.db").path

    #expect(throws: DatabaseNotFoundException.self) {
      try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)
    }
  }
}
