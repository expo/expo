// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation

public typealias PersistentFileLogFilter = (_: String) -> Bool
public typealias PersistentFileLogCompletionHandler = (_:Error?) -> Void

/**
 * A thread-safe class for reading and writing line-separated strings to a flat file. The main use case is for logging specific errors or events, and ensuring that the logs persist across application crashes and restarts (for example, OSLogReader can only read system logs for the current process, and cannot access anything logged before the current process started).
 *
 * All write access to the file goes through asynchronous public methods managed by a serial dispatch queue.
 *
 * The dispatch queue is global, to ensure that multiple instances accessing the same file will have thread-safe access.
 *
 * The only operations supported are
 * - Read the file (synchronous)
 * - Append one or more entries to the file
 * - Filter the file (only retain entries that pass the filter check)
 * - Clear the file (remove all entries)
 *
 */
public class PersistentFileLog {
  private static let EXPO_UPDATES_LOG_QUEUE_LABEL = "dev.expo.updates.logging"
  private static let serialQueue = DispatchQueue(label: EXPO_UPDATES_LOG_QUEUE_LABEL)

  private let category: String
  private let filePath: String

  public init(category: String) {
    self.category = category
    let fileName = "\(PersistentFileLog.EXPO_UPDATES_LOG_QUEUE_LABEL).\(category).txt"
    self.filePath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(fileName).path ?? ""
  }
  /**
   Read entries from log file
   */
  public func readEntries() -> [String] {
    if 0 == _getFileSize() {
      return []
    }
    do {
      return try self._readFileSync()
    } catch {
      return []
    }
  }

  /**
   Append entry to the log file
   Since logging may not require a result handler, the handler parameter is optional
   If no error handler provided, print error to the console
   */
  public func appendEntry(entry: String, _ completionHandler: PersistentFileLogCompletionHandler? = nil) {
    PersistentFileLog.serialQueue.async {
      self._ensureFileExists()
      let size = self._getFileSize()
      if size == 0 {
        self._appendTextToFile(text: entry)
      } else {
        self._appendTextToFile(text: "\n" + entry)
      }
      completionHandler?(nil)
    }
  }

  /**
   Filter existing entries and remove ones where filter(entry) == false
   */
  public func filterEntries(filter: @escaping PersistentFileLogFilter, _ completionHandler: @escaping PersistentFileLogCompletionHandler) {
    PersistentFileLog.serialQueue.async {
      self._ensureFileExists()
      do {
        let contents = try self._readFileSync()
        let newcontents = contents.filter { entry in filter(entry) }
        try self._writeFileSync(newcontents)
        completionHandler(nil)
      } catch {
        completionHandler(error)
      }
    }
  }

  /**
   Clean up (remove) the log file
   */
  public func clearEntries(_ completionHandler: @escaping PersistentFileLogCompletionHandler) {
    PersistentFileLog.serialQueue.async {
      do {
        try self._deleteFileSync()
        completionHandler(nil)
      } catch {
        completionHandler(error)
      }
    }
  }

  // MARK: - Private methods

  private func _ensureFileExists() {
    if !FileManager.default.fileExists(atPath: filePath) {
      FileManager.default.createFile(atPath: filePath, contents: nil)
    }
  }

  private func _getFileSize() -> Int {
    // Gets the file size, or returns 0 if the file does not exist
    do {
      let attrs: [FileAttributeKey: Any?] = try FileManager.default.attributesOfItem(atPath: filePath)
      return attrs[FileAttributeKey.size] as? Int ?? 0
    } catch {
      return 0
    }
  }

  private func _appendTextToFile(text: String) {
    if let data = text.data(using: .utf8) {
      if let fileHandle = FileHandle(forWritingAtPath: filePath) {
        fileHandle.seekToEndOfFile()
        fileHandle.write(data)
        fileHandle.closeFile()
      }
    }
  }

  private func _readFileSync() throws -> [String] {
    return try _stringToList(String(contentsOfFile: filePath, encoding: .utf8))
  }

  private func _writeFileSync(_ contents: [String]) throws {
    if contents.isEmpty {
      try _deleteFileSync()
      return
    }
    try contents.joined(separator: "\n").write(toFile: filePath, atomically: true, encoding: .utf8)
  }

  private func _deleteFileSync() throws {
    if FileManager.default.fileExists(atPath: filePath) {
      try FileManager.default.removeItem(atPath: filePath)
    }
  }

  private func _stringToList(_ contents: String?) -> [String] {
    // If null contents, or 0 length contents, return empty list
    return (contents != nil && contents?.lengthOfBytes(using: .utf8) ?? 0 > 0) ?
      contents?.components(separatedBy: "\n") ?? [] :
      []
  }
}
