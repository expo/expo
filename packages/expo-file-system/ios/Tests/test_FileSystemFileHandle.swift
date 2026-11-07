// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import Testing

@testable import ExpoFileSystem

@Suite("FileSystemFileHandle positional I/O")
struct FileSystemFileHandleTests {
  private func makeFile(_ contents: String) throws -> FileSystemFile {
    let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try Data(contents.utf8).write(to: url)
    return FileSystemFile(url: url)
  }

  private func bytes(_ contents: String) throws -> ArrayBuffer {
    return try ArrayBuffer.copy(data: Data(contents.utf8))
  }

  private func string(_ buffer: ArrayBuffer) -> String? {
    return String(bytes: buffer.data, encoding: .utf8)
  }

  @Test
  func readAtReturnsBytesFromPositionAndStopsAtEof() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abcdef"), mode: .read)

    #expect(string(try handle.readAt(4, 10)) == "ef")
    #expect(try handle.readAt(6, 1).byteLength == 0)
    #expect(try handle.readAt(10, 1).byteLength == 0)
  }

  @Test
  func readAtDoesNotKeepACursor() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abcdef"), mode: .read)

    #expect(string(try handle.readAt(0, 2)) == "ab")
    #expect(string(try handle.readAt(0, 2)) == "ab")
  }

  @Test
  func writeAtWritesAtPositionAndReturnsEndOffset() throws {
    let file = try makeFile("abcdef")
    let handle = try FileSystemFileHandle(file: file, mode: .readWrite)

    #expect(try handle.writeAt(2, bytes("XY")) == 4)
    try handle.close()
    #expect(try String(contentsOf: file.url, encoding: .utf8) == "abXYef")
  }

  @Test
  func writeAtPastEofGrowsTheFile() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abc"), mode: .readWrite)

    #expect(try handle.writeAt(5, bytes("Z")) == 6)
    #expect(handle.size == 6)
    #expect(Array(try handle.readAt(3, 2).data) == [0, 0])
  }

  @Test
  func appendModeIgnoresThePosition() throws {
    let file = try makeFile("abc")
    let handle = try FileSystemFileHandle(file: file, mode: .append)

    #expect(try handle.writeAt(0, bytes("d")) == 4)
    try handle.close()
    #expect(try String(contentsOf: file.url, encoding: .utf8) == "abcd")
  }

  @Test
  func truncateModeWipesTheFileOnOpen() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abc"), mode: .truncate)

    #expect(handle.size == 0)
  }

  @Test
  func readAtThrowsInWriteOnlyMode() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abc"), mode: .write)

    #expect(throws: UnableToReadHandleException.self) {
      try handle.readAt(0, 1)
    }
  }

  @Test
  func writeAtThrowsInReadOnlyMode() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abc"), mode: .read)
    let data = try bytes("x")

    #expect(throws: UnableToWriteHandleException.self) {
      try handle.writeAt(0, data)
    }
  }

  @Test
  func closedHandleRejectsReadsAndReportsNullSize() throws {
    let handle = try FileSystemFileHandle(file: makeFile("abc"), mode: .read)

    try handle.close()
    try handle.close()
    #expect(throws: UnableToReadHandleException.self) {
      try handle.readAt(0, 1)
    }
    #expect(handle.size == nil)
  }
}
