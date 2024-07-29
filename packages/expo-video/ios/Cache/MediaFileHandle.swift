//
//  MediaFileHandle.swift
//  CachingPlayerItem
//
//  Created by Gorjan Shukov on 10/24/20.
//

import Foundation

/// File handle for local file operations.
final class MediaFileHandle {
  private let filePath: String
  private lazy var readHandle = FileHandle(forReadingAtPath: filePath)
  private lazy var writeHandle = FileHandle(forWritingAtPath: filePath)

  private let lock = NSLock()

  // MARK: Init

  init(filePath: String) {
    self.filePath = filePath

    if !FileManager.default.fileExists(atPath: filePath) {
      FileManager.default.createFile(atPath: filePath, contents: nil, attributes: nil)
    } else {
      print("CachingPlayerItem warning: File already exists at \(filePath). A non empty file can cause unexpected behavior.")
    }
  }

  deinit {
    guard FileManager.default.fileExists(atPath: filePath) else { return }

    close()
  }
}

// MARK: Internal methods

extension MediaFileHandle {
  var attributes: [FileAttributeKey : Any]? {
    do {
      return try FileManager.default.attributesOfItem(atPath: filePath)
    } catch let error as NSError {
      print("FileAttribute error: \(error)")
    }
    return nil
  }

  var fileSize: Int {
    return attributes?[.size] as? Int ?? 0
  }

  func readData(withOffset offset: Int, forLength length: Int) -> Data? {
    lock.lock()
    defer { lock.unlock() }

    readHandle?.seek(toFileOffset: UInt64(offset))
    return readHandle?.readData(ofLength: length)
  }

  func append(data: Data) {
    lock.lock()
    defer { lock.unlock() }

    guard let writeHandle = writeHandle else { return }

    writeHandle.seekToEndOfFile()
    writeHandle.write(data)
  }

  func synchronize() {
    lock.lock()
    defer { lock.unlock() }

    guard let writeHandle = writeHandle else { return }

    writeHandle.synchronizeFile()
  }

  func close() {
    readHandle?.closeFile()
    writeHandle?.closeFile()
  }

  func deleteFile() {
    do {
      try FileManager.default.removeItem(atPath: filePath)
    } catch let error {
      print("File deletion error: \(error)")
    }
  }
}
