// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("FileSystemManager")
struct FileSystemManagerTests {
  let fsManager = FileSystemManager()

  @Test
  func `should return read/write permissions for filePath with file: scheme`() {
    let dirUrl = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let fileUrl = dirUrl.appendingPathComponent("dir/test.txt")
    let filePath = fileUrl.absoluteString
    #expect(filePath.starts(with: "file:") == true)
    #expect(fsManager.getPathPermissions(filePath) == [.read, .write])
  }

  @Test
  func `should return read/write permissions for filePath without file: scheme`() {
    let dirUrl = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let fileUrl = dirUrl.appendingPathComponent("dir/test.txt")
    let filePath = fileUrl.path
    #expect(filePath.starts(with: "file:") == false)
    #expect(fsManager.getPathPermissions(filePath) == [.read, .write])
  }
}
