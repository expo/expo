import Foundation

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
