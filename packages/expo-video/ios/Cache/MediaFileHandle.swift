// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

/**
 * Class meant to be used as a helper for handling files by the ResourceLoaderDelegate.
 * All operations should be dispatched from the ResourceLoaderDelegate queue.
 */
internal class MediaFileHandle {
  private let filePath: String
  private let lock = NSLock()
  private var readHandle: FileHandle?
  private var writeHandle: FileHandle?

  var attributes: [FileAttributeKey: Any]? {
    do {
      return try FileManager.default.attributesOfItem(atPath: filePath)
    } catch let error as NSError {
      log.warn("An error occured while reading the file attributes at \(filePath) error: \(error)")
    }
    return nil
  }

  var fileSize: Int {
    return attributes?[.size] as? Int ?? 0
  }

  private var fileUrl: URL? {
    URL(string: filePath)
  }

  init(filePath: String) {
    self.filePath = filePath

    if let fileUrl {
      VideoCacheManager.shared.registerOpenFile(at: fileUrl)
    }

    if !FileManager.default.fileExists(atPath: filePath) {
      FileManager.default.createFile(atPath: filePath, contents: nil, attributes: nil)
    }

    self.readHandle = FileHandle(forReadingAtPath: filePath)
    self.writeHandle = FileHandle(forWritingAtPath: filePath)

    if readHandle == nil {
      log.warn("Failed to open file for reading at: \(filePath)")
    }
    if writeHandle == nil {
      log.warn("Failed to open file for writing at: \(filePath)")
    }
  }

  deinit {
    if let fileUrl {
      VideoCacheManager.shared.unregisterOpenFile(at: fileUrl)
    }
    guard FileManager.default.fileExists(atPath: filePath) else {
      return
    }

    close()
  }

  func readData(withOffset offset: Int64, forLength length: Int) -> Data? {
    lock.lock()
    defer { lock.unlock() }

    guard let readHandle = readHandle else {
      log.warn("Read handle not available for file at: \(filePath)")
      return nil
    }

    guard offset >= 0 else {
      log.warn("Invalid negative offset: \(offset)")
      return nil
    }

    let currentSize = fileSize
    guard offset <= currentSize else {
      log.warn("Offset \(offset) exceeds file size \(currentSize)")
      return nil
    }

    do {
      try readHandle.seek(toOffset: UInt64(offset))
      let data = readHandle.readData(ofLength: length)

      if data.count < length && offset + Int64(data.count) < currentSize {
        log.warn("Read \(data.count) bytes but expected \(length) bytes")
      }

      return data
    } catch {
      log.warn("Failed to read data at offset \(offset): \(error)")
      return nil
    }
  }

  func write(data: Data, atOffset offset: Int64) throws {
    lock.lock()
    defer { lock.unlock() }

    guard let writeHandle = writeHandle else {
      throw VideoCacheException("Failed to write data to cache file handle: Write handle not available for file at: \(filePath)")
    }

    // Validate offset is non-negative
    guard offset >= 0 else {
      throw VideoCacheException("Failed to write data to cache file handle: Invalid negative offset: \(offset)")
    }

    try writeHandle.seek(toOffset: UInt64(offset))

    writeHandle.write(data)
    writeHandle.synchronizeFile()
  }

  func append(data: Data) {
    lock.lock()
    defer { lock.unlock() }
    guard let writeHandle = writeHandle else {
      return
    }

    writeHandle.seekToEndOfFile()
    writeHandle.write(data)
    writeHandle.synchronizeFile()
  }

  func close() {
    readHandle?.closeFile()
    writeHandle?.closeFile()
  }
}
