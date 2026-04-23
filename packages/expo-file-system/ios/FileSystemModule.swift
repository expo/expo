// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

@available(iOS 14, tvOS 14, *)
public final class FileSystemModule: Module {
  #if os(iOS)
  private lazy var filePickingHandler = FilePickingHandler(module: self)
  #endif

  private let downloadStore = DownloadTaskStore()

  var documentDirectory: URL? {
    return appContext?.config.documentDirectory
  }

  var cacheDirectory: URL? {
    return appContext?.config.cacheDirectory
  }

  var totalDiskSpace: Int64? {
    guard let path = documentDirectory?.path,
      let attributes = try? FileManager.default.attributesOfFileSystem(forPath: path) else {
      return nil
    }
    return attributes[.systemSize] as? Int64
  }

  var availableDiskSpace: Int64? {
    guard let path = documentDirectory?.path,
      let attributes = try? FileManager.default.attributesOfFileSystem(forPath: path) else {
      return nil
    }
    return attributes[.systemFreeSize] as? Int64
  }

  public func definition() -> ModuleDefinition {
    Name("FileSystem")

    Events("downloadProgress")

    Constant("documentDirectory") {
      return documentDirectory?.absoluteString
    }

    Constant("cacheDirectory") {
      return cacheDirectory?.absoluteString
    }

    Constant("bundleDirectory") {
      return Bundle.main.bundlePath
    }

    Constant("appleSharedContainers") {
      return getAppleSharedContainers()
    }

    Property("totalDiskSpace") {
      return totalDiskSpace
    }

    Property("availableDiskSpace") {
      return availableDiskSpace
    }

    AsyncFunction("downloadFileAsync") { (url: URL, to: FileSystemPath, options: DownloadOptions?, downloadUuid: String?, promise: Promise) in
      try downloadFileWithStore(
        url: url,
        to: to,
        options: options,
        downloadUuid: downloadUuid,
        downloadStore: self.downloadStore,
        promise: promise,
        sendEvent: { [weak self] name, body in
          self?.sendEvent(name, body)
        }
      )
    }

    Function("cancelDownloadAsync") { (downloadUuid: String) in
      self.downloadStore.cancel(uuid: downloadUuid)
    }

    AsyncFunction("pickDirectoryAsync") { (initialUri: URL?, promise: Promise) in
      #if os(iOS)
      filePickingHandler.presentDocumentPicker(
        picker: createDirectoryPicker(initialUri: initialUri),
        isDirectory: true,
        initialUri: initialUri,
        mimeTypes: [],
        multipleDocuments: false,
        promise: promise
      )
      #else
      promise.reject(FeatureNotAvailableOnPlatformException())
      #endif
    }.runOnQueue(.main)

    AsyncFunction("pickFileAsync") { (options: FilePickingOptions?, promise: Promise) in
      #if os(iOS)
      filePickingHandler.presentDocumentPicker(
        picker: createFilePicker(initialUri: options?.initialUri, mimeTypes: options?.mimeTypes ?? []),
        isDirectory: false,
        initialUri: options?.initialUri,
        mimeTypes: options?.mimeTypes ?? [],
        multipleDocuments: options?.multipleFiles ?? false,
        promise: promise
      )
      #else
      promise.reject(FeatureNotAvailableOnPlatformException())
      #endif
    }.runOnQueue(.main)
    Function("info") { (url: URL) in
      let output = PathInfo()
      output.exists = false
      output.isDirectory = nil

      guard let fileSystemManager = appContext?.fileSystem else {
        return output
      }

      if fileSystemManager.getPathPermissions(url.path).contains(.read) {
        var isDirectory: ObjCBool = false
        if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
          output.exists = true
          output.isDirectory = isDirectory.boolValue
          return output
        }
      }
      return output
    }

    AsyncFunction("zip") { (sources: [FileSystemPath], destination: FileSystemPath, options: ZipOptions?) in
      return try ZipOperations.zip(sources: sources, destination: destination, options: options ?? ZipOptions())
    }

    Function("zipSync") { (sources: [FileSystemPath], destination: FileSystemPath, options: ZipOptions?) in
      return try ZipOperations.zip(sources: sources, destination: destination, options: options ?? ZipOptions())
    }

    AsyncFunction("unzip") { (source: FileSystemFile, destination: FileSystemDirectory, options: UnzipOptions?) in
      return try ZipOperations.unzip(source: source, destination: destination, options: options ?? UnzipOptions())
    }

    Function("unzipSync") { (source: FileSystemFile, destination: FileSystemDirectory, options: UnzipOptions?) in
      return try ZipOperations.unzip(source: source, destination: destination, options: options ?? UnzipOptions())
    }

    // swiftlint:disable:next closure_body_length
    Class(FileSystemFile.self) {
      Constructor { (url: URL) in
        return FileSystemFile(url: url.standardizedFileURL)
      }

      // we can't throw in a constructor, so this is a workaround
      Function("validatePath") { file in
        try file.validatePath()
      }

      // maybe asString, readAsString, readAsText, readText, ect.
      AsyncFunction("text") { file in
        return try file.text()
      }

      Function("textSync") { file in
        return try file.text()
      }

      AsyncFunction("base64") { file in
        return try file.base64()
      }

      Function("base64Sync") { file in
        return try file.base64()
      }

      AsyncFunction("bytes") { file in
        return try file.bytes()
      }

      Function("bytesSync") { file in
        return try file.bytes()
      }

      Function("open") { (file: FileSystemFile, mode: FileMode?) in
        return try FileSystemFileHandle(file: file, mode: mode)
      }

      Function("info") { (file: FileSystemFile, options: InfoOptions?) in
        return try file.info(options: options ?? InfoOptions())
      }

      Function("write") { (file: FileSystemFile, content: Either<String, TypedArray>, options: WriteOptions?) in
        let append = options?.append ?? false
        if let content: String = content.get() {
          if options?.encoding == WriteEncoding.base64 {
            guard let data = Data(base64Encoded: content, options: .ignoreUnknownCharacters) else {
              throw UnableToWriteBase64DataException(file.url.absoluteString)
            }
            try file.write(data, append: append)
          } else {
            try file.write(content, append: append)
          }
        }
        if let content: TypedArray = content.get() {
          try file.write(content, append: append)
        }
      }

      Property("size") { file in
        try? file.size
      }

      Property("md5") { file in
        try? file.md5
      }

      Property("modificationTime") { file in
        try? file.modificationTime
      }

      Property("lastModified") { file in
        try? file.modificationTime
      }

      Property("creationTime") { file in
        try? file.creationTime
      }

      Property("type") { file in
        file.type
      }

      Function("delete") { file in
        try file.delete()
      }

      Property("exists") { file in
        return file.exists
      }

      Function("create") { (file, options: CreateOptions?) in
        try file.create(options ?? CreateOptions())
      }

      AsyncFunction("copy") { (file, to: FileSystemPath, options: RelocationOptions?) in
        try file.copy(to: to, options: options ?? RelocationOptions())
      }

      Function("copySync") { (file, to: FileSystemPath, options: RelocationOptions?) in
        try file.copy(to: to, options: options ?? RelocationOptions())
      }

      AsyncFunction("move") { (file, to: FileSystemPath, options: RelocationOptions?) in
        try file.move(to: to, options: options ?? RelocationOptions())
      }

      Function("moveSync") { (file, to: FileSystemPath, options: RelocationOptions?) in
        try file.move(to: to, options: options ?? RelocationOptions())
      }

      Function("rename") { (file, newName: String) in
        try file.rename(newName)
      }

      Property("uri") { file in
        return file.url.absoluteString
      }
    }

    Class(FileSystemFileHandle.self) {
      Function("readBytes") { (fileHandle, bytes: Int) in
        try fileHandle.read(bytes)
      }

      Function("writeBytes") { (fileHandle, bytes: Data) in
        try fileHandle.write(bytes)
      }

      Function("close") { fileHandle in
        try fileHandle.close()
      }

      Property("offset") { fileHandle in
        fileHandle.offset
      }.set { (fileHandle, volume: UInt64) in
        fileHandle.offset = volume
      }

      Property("size") { fileHandle in
        fileHandle.size
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(FileSystemDirectory.self) {
      Constructor { (url: URL) in
        return FileSystemDirectory(url: url.standardizedFileURL)
      }

      Function("info") { directory in
        try directory.info()
      }

      // we can't throw in a constructor, so this is a workaround
      Function("validatePath") { directory in
        try directory.validatePath()
      }

      Function("delete") { directory in
        try directory.delete()
      }

      Property("exists") { directory in
        return directory.exists
      }

      Function("create") { (directory, options: CreateOptions?) in
        try directory.create(options ?? CreateOptions())
      }

      AsyncFunction("copy") { (directory, to: FileSystemPath, options: RelocationOptions?) in
        try directory.copy(to: to, options: options ?? RelocationOptions())
      }

      Function("copySync") { (directory, to: FileSystemPath, options: RelocationOptions?) in
        try directory.copy(to: to, options: options ?? RelocationOptions())
      }

      AsyncFunction("move") { (directory, to: FileSystemPath, options: RelocationOptions?) in
        try directory.move(to: to, options: options ?? RelocationOptions())
      }

      Function("moveSync") { (directory, to: FileSystemPath, options: RelocationOptions?) in
        try directory.move(to: to, options: options ?? RelocationOptions())
      }

      Function("rename") { (directory, newName: String) in
        try directory.rename(newName)
      }

      // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
      Function("listAsRecords") { directory in
        try directory.listAsRecords()
      }

      Function("createFile") { (directory, name: String, content: String?) in
        let file = FileSystemFile(url: directory.url.appendingPathComponent(name))
        try file.create(CreateOptions())
        return file
      }

      Function("createDirectory") { (directory, name: String) in
        let newDirectory = FileSystemDirectory(url: directory.url.appendingPathComponent(name))
        try newDirectory.create(CreateOptions())
        return newDirectory
      }

      Property("uri") { directory in
        return directory.url.absoluteString
      }

      Property("size") { directory in
        return try? directory.size
      }
    }

    Class("ZipArchive", ZipArchiveObject.self) {
      Constructor { (source: FileSystemFile) in
        guard source.exists else {
          throw ZipSourceNotFoundException(source.url.absoluteString)
        }
        return ZipArchiveObject(sourceFile: source)
      }

      Function("list") { archive in
        try archive.list()
      }

      AsyncFunction("extractEntry") { (archive: ZipArchiveObject, entryName: String, destination: FileSystemPath) in
        try archive.extractEntry(entryName: entryName, destination: destination)
      }

      Function("extractEntrySync") { (archive: ZipArchiveObject, entryName: String, destination: FileSystemPath) in
        try archive.extractEntry(entryName: entryName, destination: destination)
      }

      Function("asFile") { archive in
        archive.asFile()
      }

      Function("close") { archive in
        archive.close()
      }
    }
  }

  private func getAppleSharedContainers() -> [String: String] {
    guard let appContext else {
      return [:]
    }
    var result: [String: String] = [:]
    for appGroup in appContext.appCodeSignEntitlements.appGroups ?? [] {
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) {
        result[appGroup] = directory.standardizedFileURL.path
      }
    }
    return result
  }
}

