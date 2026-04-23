import Foundation
import ExpoModulesCore
import ZIPFoundation

internal struct ZipOperations {

  static func zip(
    sources: [FileSystemPath],
    destination: FileSystemPath,
    options: ZipOptions
  ) throws -> FileSystemFile {
    guard !sources.isEmpty else {
      throw UnableToZipException("sources list is empty")
    }

    // Validate sources exist
    for source in sources {
      guard FileManager.default.fileExists(atPath: source.url.path) else {
        throw ZipSourceNotFoundException(source.url.absoluteString)
      }
    }

    // Resolve destination
    let destURL = resolveZipDestination(destination: destination, firstSource: sources[0])

    // Handle overwrite
    if FileManager.default.fileExists(atPath: destURL.path) {
      if !options.overwrite {
        throw DestinationAlreadyExistsException()
      }
      try FileManager.default.removeItem(at: destURL)
    }

    // Ensure parent directory exists
    let parentDir = destURL.deletingLastPathComponent()
    if !FileManager.default.fileExists(atPath: parentDir.path) {
      try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)
    }

    // Determine compression method
    let compression: CompressionMethod = options.compressionLevel == .none ? .none : .deflate

    guard let archive = Archive(url: destURL, accessMode: .create) else {
      throw UnableToZipException("failed to create archive at \(destURL.path)")
    }

    for source in sources {
      let sourceURL = source.url
      var isDirectory: ObjCBool = false
      FileManager.default.fileExists(atPath: sourceURL.path, isDirectory: &isDirectory)

      if isDirectory.boolValue {
        try addDirectoryToArchive(
          archive: archive,
          directoryURL: sourceURL,
          includeRootDirectory: options.includeRootDirectory,
          compression: compression
        )
      } else {
        let entryName = sourceURL.lastPathComponent
        try archive.addEntry(
          with: entryName,
          relativeTo: sourceURL.deletingLastPathComponent(),
          compressionMethod: compression
        )
      }
    }

    return FileSystemFile(url: destURL)
  }

  static func unzip(
    source: FileSystemFile,
    destination: FileSystemDirectory,
    options: UnzipOptions
  ) throws -> FileSystemDirectory {
    let sourceURL = source.url

    guard FileManager.default.fileExists(atPath: sourceURL.path) else {
      throw ZipSourceNotFoundException(sourceURL.absoluteString)
    }

    var destURL = destination.url

    if options.createContainingDirectory {
      let archiveName = sourceURL.deletingPathExtension().lastPathComponent
      destURL = destURL.appendingPathComponent(archiveName, isDirectory: true)
    }

    if !FileManager.default.fileExists(atPath: destURL.path) {
      try FileManager.default.createDirectory(at: destURL, withIntermediateDirectories: true)
    }

    guard let archive = Archive(url: sourceURL, accessMode: .read) else {
      throw UnableToUnzipException("failed to open archive at \(sourceURL.path)")
    }

    for entry in archive {
      let entryDestURL = destURL.appendingPathComponent(entry.path)

      // Zip slip protection
      guard isContained(entryDestURL, in: destURL) else {
        throw UnableToUnzipException("entry '\(entry.path)' is outside of the target directory (zip slip)")
      }

      if FileManager.default.fileExists(atPath: entryDestURL.path) {
        if !options.overwrite {
          throw UnableToUnzipException("entry path '\(entry.path)' conflicts with an existing file")
        }
        try FileManager.default.removeItem(at: entryDestURL)
      }

      _ = try archive.extract(entry, to: entryDestURL, skipCRC32: false)
    }

    return FileSystemDirectory(url: destURL)
  }

  // MARK: - Private helpers

  private static func resolveZipDestination(
    destination: FileSystemPath,
    firstSource: FileSystemPath
  ) -> URL {
    if destination is FileSystemDirectory {
      let sourceName = firstSource.url.lastPathComponent
      let zipName = sourceName.hasSuffix(".zip") ? sourceName : "\(sourceName).zip"
      return destination.url.appendingPathComponent(zipName)
    }
    return destination.url
  }

  private static func addDirectoryToArchive(
    archive: Archive,
    directoryURL: URL,
    includeRootDirectory: Bool,
    compression: CompressionMethod
  ) throws {
    let baseURL = includeRootDirectory
      ? directoryURL.deletingLastPathComponent()
      : directoryURL

    let enumerator = FileManager.default.enumerator(
      at: directoryURL,
      includingPropertiesForKeys: [.isDirectoryKey],
      options: []
    )

    // If including root directory, add the directory entry itself
    if includeRootDirectory {
      try archive.addEntry(
        with: directoryURL.lastPathComponent + "/",
        relativeTo: directoryURL.deletingLastPathComponent(),
        compressionMethod: compression
      )
    }

    while let fileURL = enumerator?.nextObject() as? URL {
      try archive.addEntry(
        with: fileURL.path.replacingOccurrences(of: baseURL.path + "/", with: ""),
        relativeTo: baseURL,
        compressionMethod: compression
      )
    }
  }

  private static func isContained(_ candidateURL: URL, in directoryURL: URL) -> Bool {
    let directoryPath = directoryURL.standardizedFileURL.path
    let candidatePath = candidateURL.standardizedFileURL.path

    return candidatePath == directoryPath || candidatePath.hasPrefix(directoryPath + "/")
  }
}
