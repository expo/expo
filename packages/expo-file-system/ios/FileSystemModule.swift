// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

@available(iOS 14, tvOS 14, *)
public final class FileSystemModule: Module {
  #if os(iOS)
  private lazy var filePickingHandler = FilePickingHandler(module: self)
  #endif

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
    return attributes[.systemFreeSize] as? Int64
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

    // swiftlint:disable:next closure_body_length
    AsyncFunction("downloadFileAsync") { (url: URL, to: FileSystemPath, options: DownloadOptions?, promise: Promise) in
      try to.validatePermission(.write)

      var request = URLRequest(url: url)

      if let headers = options?.headers {
        headers.forEach { key, value in
          request.addValue(value, forHTTPHeaderField: key)
        }
      }

      let downloadTask = URLSession.shared.downloadTask(with: request) { urlOrNil, responseOrNil, errorOrNil in
        guard errorOrNil == nil else {
          return promise.reject(UnableToDownloadException(errorOrNil?.localizedDescription ?? "unspecified error"))
        }
        guard let httpResponse = responseOrNil as? HTTPURLResponse else {
          return promise.reject(UnableToDownloadException("no response"))
        }
        guard httpResponse.statusCode >= 200 && httpResponse.statusCode < 300 else {
          return promise.reject(UnableToDownloadException("response has status \(httpResponse.statusCode)"))
        }
        guard let fileURL = urlOrNil else {
          return promise.reject(UnableToDownloadException("no file url"))
        }

        do {
          let destination: URL
          if let to = to as? FileSystemDirectory {
            let filename = httpResponse.suggestedFilename ?? url.lastPathComponent
            destination = to.url.appendingPathComponent(filename)
          } else {
            destination = to.url
          }
          if FileManager.default.fileExists(atPath: destination.path) {
            throw DestinationAlreadyExistsException()
          }
          try FileManager.default.moveItem(at: fileURL, to: destination)
          // TODO: Remove .url.absoluteString once returning shared objects works
          promise.resolve(destination.absoluteString)
        } catch {
          promise.reject(error)
        }
      }
      downloadTask.resume()
    }

    AsyncFunction("pickDirectoryAsync") { (initialUri: URL?, promise: Promise) in
      #if os(iOS)
      filePickingHandler.presentDocumentPicker(
        picker: createDirectoryPicker(initialUri: initialUri),
        isDirectory: true,
        initialUri: initialUri,
        mimeType: nil,
        promise: promise
      )
      #else
      promise.reject(FeatureNotAvailableOnPlatformException())
      #endif
    }.runOnQueue(.main)

    AsyncFunction("pickFileAsync") { (initialUri: URL?, mimeType: String?, promise: Promise) in
      #if os(iOS)
      filePickingHandler.presentDocumentPicker(
        picker: createFilePicker(initialUri: initialUri, mimeType: mimeType),
        isDirectory: false,
        initialUri: initialUri,
        mimeType: mimeType,
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

      guard let permissionsManager: EXFilePermissionModuleInterface = appContext?.legacyModule(implementing: EXFilePermissionModuleInterface.self) else {
        return output
      }

      if permissionsManager.getPathPermissions(url.path).contains(.read) {
        var isDirectory: ObjCBool = false
        if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
          output.exists = true
          output.isDirectory = isDirectory.boolValue
          return output
        }
      }
      return output
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

      Function("open") { file in
        return try FileSystemFileHandle(file: file)
      }

      Function("info") { (file: FileSystemFile, options: InfoOptions?) in
        return try file.info(options: options ?? InfoOptions())
      }

      Function("write") { (file, content: Either<String, TypedArray>) in
        if let content: String = content.get() {
          try file.write(content)
        }
        if let content: TypedArray = content.get() {
          try file.write(content)
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

      Function("copy") { (file, to: FileSystemPath) in
        try file.copy(to: to)
      }

      Function("move") { (file, to: FileSystemPath) in
        try file.move(to: to)
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

      Function("copy") { (directory, to: FileSystemPath) in
        try directory.copy(to: to)
      }

      Function("move") { (directory, to: FileSystemPath) in
        try directory.move(to: to)
      }

      Function("rename") { (directory, newName: String) in
        try directory.rename(newName)
      }

      // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
      Function("listAsRecords") { directory in
        try directory.listAsRecords()
      }

      Property("uri") { directory in
        return directory.url.absoluteString
      }

      Property("size") { directory in
        return try? directory.size
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
