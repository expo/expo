// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import ExpoSQLite

class DatabaseFileUtilsTests: XCTestCase {
  private var tempDir: URL!

  override func setUpWithError() throws {
    tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
  }

  override func tearDownWithError() throws {
    try? FileManager.default.removeItem(at: tempDir)
  }

  private func createFile(_ name: String) -> String {
    let path = tempDir.appendingPathComponent(name).path
    FileManager.default.createFile(atPath: path, contents: Data("data".utf8))
    return path
  }

  func testDeletesTheMainDatabaseFile() throws {
    let dbPath = createFile("test.db")

    try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)

    XCTAssertFalse(FileManager.default.fileExists(atPath: dbPath))
  }

  func testDeletesJournalWalAndShmSidecarFilesAlongWithTheDatabase() throws {
    let dbPath = createFile("test.db")
    let journalPath = createFile("test.db-journal")
    let walPath = createFile("test.db-wal")
    let shmPath = createFile("test.db-shm")

    try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)

    XCTAssertFalse(FileManager.default.fileExists(atPath: dbPath))
    XCTAssertFalse(FileManager.default.fileExists(atPath: journalPath))
    XCTAssertFalse(FileManager.default.fileExists(atPath: walPath))
    XCTAssertFalse(FileManager.default.fileExists(atPath: shmPath))
  }

  func testKeepsUnrelatedFilesIntact() throws {
    let dbPath = createFile("test.db")
    let otherDbPath = createFile("test2.db")
    let otherWalPath = createFile("test2.db-wal")

    try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)

    XCTAssertFalse(FileManager.default.fileExists(atPath: dbPath))
    XCTAssertTrue(FileManager.default.fileExists(atPath: otherDbPath))
    XCTAssertTrue(FileManager.default.fileExists(atPath: otherWalPath))
  }

  func testThrowsWhenTheMainDatabaseFileDoesNotExist() {
    let dbPath = tempDir.appendingPathComponent("missing.db").path

    XCTAssertThrowsError(try DatabaseFileUtils.deleteDatabaseFiles(atPath: dbPath)) { error in
      XCTAssertTrue(error is DatabaseNotFoundException)
    }
  }
}
