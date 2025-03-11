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
  private lazy var readHandle = FileHandle(forReadingAtPath: filePath)
  private lazy var writeHandle = FileHandle(forWritingAtPath: filePath)

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

  func readData(withOffset offset: Int, forLength length: Int) -> Data? {
    lock.lock()
    defer { lock.unlock() }

    readHandle?.seek(toFileOffset: UInt64(offset))
    return readHandle?.readData(ofLength: length)
  }

  func write(data: Data, atOffset offset: Int) throws {
    lock.lock()
    defer { lock.unlock() }

    guard let writeHandle = writeHandle else {
      return
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
