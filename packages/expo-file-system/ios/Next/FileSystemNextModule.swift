// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

@available(iOS 14, tvOS 14, *)
public final class FileSystemNextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FileSystemNext")

    Constants {
      return [
        "documentDirectory": appContext?.config.documentDirectory?.absoluteString,
        "cacheDirectory": appContext?.config.cacheDirectory?.absoluteString,
        "bundleDirectory": Bundle.main.bundlePath,
        "appleSharedContainers": getAppleSharedContainers()
      ]
    }

    AsyncFunction("downloadFileAsync") { (url: URL, to: FileSystemPath, promise: Promise) in
      try to.validatePermission(.write)

      let downloadTask = URLSession.shared.downloadTask(with: url) { urlOrNil, responseOrNil, errorOrNil in
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
