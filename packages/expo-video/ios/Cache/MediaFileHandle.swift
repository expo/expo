import Foundation
import ExpoModulesCore

final class MediaFileHandle {
  private let filePath: String
  private var fileUrl: URL? {
    URL(string: filePath)
  }
  private lazy var readHandle = FileHandle(forReadingAtPath: filePath)
  private lazy var writeHandle = FileHandle(forWritingAtPath: filePath)

  private let lock = NSLock()

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
}

extension MediaFileHandle {
  var attributes: [FileAttributeKey : Any]? {
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

  func readData(withOffset offset: Int, forLength length: Int) -> Data? {
    lock.lock()
    defer { lock.unlock() }

    readHandle?.seek(toFileOffset: UInt64(offset))
    return readHandle?.readData(ofLength: length)
  }

  func write(data: Data, atOffset offset: Int) throws {
    lock.lock()
    defer { lock.unlock() }
    guard let writeHandle = writeHandle else { return }
    try writeHandle.seek(toOffset: UInt64(offset))
    writeHandle.write(data)
    writeHandle.synchronizeFile()
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
      log.warn("Failed to delete file at \(filePath): \(error.localizedDescription)")
    }
  }
}
