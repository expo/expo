// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

@available(iOS 14, tvOS 14, *)
public final class FileSystemNextModule: Module {
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
    Name("FileSystemNext")

    Constants {
      return [
        "documentDirectory": documentDirectory?.absoluteString,
        "cacheDirectory": cacheDirectory?.absoluteString,
        "bundleDirectory": Bundle.main.bundlePath,
        "appleSharedContainers": getAppleSharedContainers()
      ]
    }

    Property("totalDiskSpace") {
      return totalDiskSpace
    }

    Property("availableDiskSpace") {
      return availableDiskSpace
    }

    AsyncFunction("downloadFileAsync") { (url: URL, to: FileSystemPath, options: DownloadOptionsNext?, promise: Promise) in
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

    Class(FileSystemFile.self) {
      Constructor { (url: URL) in
        return FileSystemFile(url: url.standardizedFileURL)
      }

      // we can't throw in a constructor, so this is a workaround
      Function("validatePath") { file in
        try file.validatePath()
      }

      // maybe asString, readAsString, readAsText, readText, ect.
      Function("text") { file in
        return try file.text()
      }

      Function("base64") { file in
        return try file.base64()
      }

      Function("bytes") { file in
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
        return (try? file.exists) ?? false
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

    Class(FileSystemDirectory.self) {
      Constructor { (url: URL) in
        return FileSystemDirectory(url: url.standardizedFileURL)
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
