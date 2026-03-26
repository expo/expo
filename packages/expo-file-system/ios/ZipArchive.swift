// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore
import ZIPFoundation

internal final class ZipArchiveObject: SharedObject {
  private let sourceFile: FileSystemFile
  private var archive: Archive?

  init(sourceFile: FileSystemFile) {
    self.sourceFile = sourceFile
    super.init()
  }

  private func getArchive() throws -> Archive {
    if let existing = archive {
      return existing
    }
    guard let opened = Archive(url: sourceFile.url, accessMode: .read) else {
      throw UnableToUnzipException("failed to open archive at \(sourceFile.url.path)")
    }
    archive = opened
    return opened
  }

  func list() throws -> [ZipEntryRecord] {
    let archive = try getArchive()
    return archive.map { entry in
      let record = ZipEntryRecord()
      record.name = entry.path
      record.isDirectory = entry.type == .directory
      record.size = Int64(entry.uncompressedSize)
      record.compressedSize = Int64(entry.compressedSize)
      // crc32 is not directly available via ZIP Foundation
      record.lastModified = entry.fileAttributes[.modificationDate]
        .flatMap { ($0 as? Date)?.timeIntervalSince1970 }
        .map { $0 * 1000 }
      record.compressionMethod = entry.type == .directory
        ? nil
        : (entry.isCompressed ? "deflate" : "none")
      return record
    }
  }

  func extractEntry(entryName: String, destination: FileSystemPath) throws -> FileSystemFile {
    let archive = try getArchive()

    guard let entry = archive[entryName] else {
      throw UnableToUnzipException("entry '\(entryName)' not found in archive")
    }

    let destURL: URL
    if destination is FileSystemDirectory {
      let fileName = URL(fileURLWithPath: entryName).lastPathComponent
      destURL = destination.url.appendingPathComponent(fileName)
    } else {
      destURL = destination.url
    }

    // Ensure parent directory exists
    let parentDir = destURL.deletingLastPathComponent()
    if !FileManager.default.fileExists(atPath: parentDir.path) {
      try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)
    }

    // Remove existing file if present
    if FileManager.default.fileExists(atPath: destURL.path) {
      try FileManager.default.removeItem(at: destURL)
    }

    _ = try archive.extract(entry, to: destURL)

    return FileSystemFile(url: destURL)
  }

  func asFile() -> FileSystemFile {
    return sourceFile
  }

  func close() {
    archive = nil
  }
}
