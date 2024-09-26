// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation

public typealias PersistentFileLogFilter = (String) -> Bool
public typealias PersistentFileLogCompletionHandler = (Error?) -> Void

/**
 * A thread-safe class for reading and writing line-separated strings to a flat file.
 * The main use case is for logging specific errors or events, and ensuring that the
 * logs persist across application crashes and restarts (for example, OSLogReader can
 * only read system logs for the current process, and cannot access anything logged
 * before the current process started).
 *
 * All write access to the file goes through asynchronous public methods managed by a
 * serial dispatch queue.
 *
 * The dispatch queue is global, to ensure that multiple instances accessing the same
 * file will have thread-safe access.
 *
 * The only operations supported are
 * - Read the file (synchronous)
 * - Append one or more entries to the file
 * - Filter the file (only retain entries that pass the filter check)
 * - Clear the file (remove all entries)
 *
 */
public class PersistentFileLog {
  private static let EXPO_MODULES_CORE_LOG_QUEUE_LABEL = "dev.expo.modules.core.logging"
  private static let serialQueue = DispatchQueue(label: EXPO_MODULES_CORE_LOG_QUEUE_LABEL)

  private let category: String
  private let filePath: String

  public init(category: String) {
    self.category = category
    let fileName = "\(PersistentFileLog.EXPO_MODULES_CORE_LOG_QUEUE_LABEL).\(category).txt"
    // Execution aborts if no application support directory
    self.filePath = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!.appendingPathComponent(fileName).path
  }
  /**
   Read entries from log file
   */
  public func readEntries() -> [String] {
    if getFileSize() == 0 {
      return []
    }
    return (try? self.readFileSync()) ?? []
  }

  /**
   Append entry to the log file
   Since logging may not require a result handler, the handler parameter is optional
   If no error handler provided, print error to the console
   */
  public func appendEntry(entry: String, _ completionHandler: PersistentFileLogCompletionHandler? = nil) {
    PersistentFileLog.serialQueue.async {
      self.ensureFileExists()
      do {
        try self.appendTextToFile(text: entry + "\n")
        completionHandler?(nil)
      } catch {
        completionHandler?(error)
      }
    }
  }

  /**
   Filter existing entries and remove ones where filter(entry) == false
   */
  public func purgeEntriesNotMatchingFilter(filter: @escaping PersistentFileLogFilter, _ completionHandler: @escaping PersistentFileLogCompletionHandler) {
    PersistentFileLog.serialQueue.async {
      self.ensureFileExists()
      do {
        let contents = try self.readFileSync()
        let newcontents = contents.filter { entry in filter(entry) }
        try self.writeFileSync(newcontents)
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
        try self.deleteFileSync()
        completionHandler(nil)
      } catch {
        completionHandler(error)
      }
    }
  }

  // MARK: - Private methods

  private func ensureFileExists() {
    if !FileManager.default.fileExists(atPath: filePath) {
      FileManager.default.createFile(atPath: filePath, contents: nil)
    }
  }

  private func getFileSize() -> Int {
    // Gets the file size, or returns 0 if the file does not exist
    do {
      let attrs: [FileAttributeKey: Any?] = try FileManager.default.attributesOfItem(atPath: filePath)
      return attrs[FileAttributeKey.size] as? Int ?? 0
    } catch {
      return 0
    }
  }

  private func appendTextToFile(text: String) throws {
    if let data = text.data(using: .utf8) {
      if let fileHandle = FileHandle(forWritingAtPath: filePath) {
        fileHandle.seekToEndOfFile()
        try fileHandle.write(data)
        fileHandle.closeFile()
      }
    }
  }

  private func readFileSync() throws -> [String] {
    return try stringToList(String(contentsOfFile: filePath, encoding: .utf8))
  }

  private func writeFileSync(_ contents: [String]) throws {
    if contents.isEmpty {
      try deleteFileSync()
      return
    }
    try contents.joined(separator: "\n").write(toFile: filePath, atomically: true, encoding: .utf8)
  }

  private func deleteFileSync() throws {
    if FileManager.default.fileExists(atPath: filePath) {
      try FileManager.default.removeItem(atPath: filePath)
    }
  }

  private func stringToList(_ contents: String?) -> [String] {
    // If null contents, or 0 length contents, return empty list
    guard let contents = contents, !contents.isEmpty else {
      return []
    }
    return contents
      .components(separatedBy: "\n")
      .filter {entryString in
        !entryString.isEmpty
      }
  }
}
