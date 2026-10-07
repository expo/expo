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

  @Test
  func `removes database files and sidecars and ignores missing ones`() {
    let dbPath = createFile("test.db")
    let walPath = createFile("test.db-wal")
    let shmPath = createFile("test.db-shm")
    let missingPath = tempDir.appendingPathComponent("missing.db").path

    DatabaseFileUtils.removeDatabaseFiles(atPath: dbPath)
    DatabaseFileUtils.removeDatabaseFiles(atPath: missingPath)

    #expect(!FileManager.default.fileExists(atPath: dbPath))
    #expect(!FileManager.default.fileExists(atPath: walPath))
    #expect(!FileManager.default.fileExists(atPath: shmPath))
  }

  @Test
  func `resolves a plain path with spaces and non-ASCII characters as is`() {
    let path = "/tmp/My Dir/a#b?c データ.db"

    #expect(DatabaseFileUtils.fileURL(fromDatabasePath: path)?.toFilePath() == path)
  }

  @Test
  func `resolves a file URI with spaces, non-ASCII characters, hash and question mark`() {
    let url = DatabaseFileUtils.fileURL(fromDatabasePath: "file:///tmp/My Dir/a#b?c データ.db")

    #expect(url?.isFileURL == true)
    #expect(url?.toFilePath() == "/tmp/My Dir/a#b?c データ.db")
  }

  @Test
  func `keeps escapes of an already encoded file URI`() {
    let url = DatabaseFileUtils.fileURL(fromDatabasePath: "file:///tmp/My%20Dir/%E3%83%87.db")

    #expect(url?.toFilePath() == "/tmp/My Dir/デ.db")
  }

  @Test
  func `reports the legacy percent-encoded path only for a plain path that was encoded`() {
    guard #available(iOS 17, tvOS 17, macOS 14, *) else {
      return
    }
    let plainPath = "/tmp/My Dir/a.db"
    let legacyPath = DatabaseFileUtils.legacyEncodedPath(forDatabasePath: plainPath, resolvedPath: plainPath)

    #expect(legacyPath == "/tmp/My%20Dir/a.db")
    #expect(DatabaseFileUtils.legacyEncodedPath(forDatabasePath: "/tmp/dir/a.db", resolvedPath: "/tmp/dir/a.db") == nil)
    #expect(DatabaseFileUtils.legacyEncodedPath(forDatabasePath: "file:///tmp/My Dir/a.db", resolvedPath: plainPath) == nil)
  }

  @Test
  func `moves legacy database files and sidecars to the resolved path`() throws {
    let legacyPath = createFile("legacy.db")
    let legacyWalPath = createFile("legacy.db-wal")
    let path = tempDir.appendingPathComponent("resolved.db").path

    try DatabaseFileUtils.migrateLegacyDatabaseFiles(fromPath: legacyPath, toPath: path)

    #expect(FileManager.default.fileExists(atPath: path))
    #expect(FileManager.default.fileExists(atPath: path + "-wal"))
    #expect(!FileManager.default.fileExists(atPath: legacyPath))
    #expect(!FileManager.default.fileExists(atPath: legacyWalPath))
  }

  @Test
  func `does not migrate when the resolved database already exists`() throws {
    let legacyPath = createFile("legacy.db")
    let path = createFile("resolved.db")

    try DatabaseFileUtils.migrateLegacyDatabaseFiles(fromPath: legacyPath, toPath: path)

    #expect(FileManager.default.fileExists(atPath: legacyPath))
    #expect(String(data: FileManager.default.contents(atPath: path) ?? Data(), encoding: .utf8) == "data")
  }
}
