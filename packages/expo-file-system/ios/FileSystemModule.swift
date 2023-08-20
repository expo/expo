// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

private let EVENT_DOWNLOAD_PROGRESS = "expo-file-system.downloadProgress"
private let EVENT_UPLOAD_PROGRESS = "expo-file-system.uploadProgress"

public final class FileSystemModule: Module {
  private lazy var sessionTaskDispatcher = EXSessionTaskDispatcher(sessionHandler: ExpoAppDelegate.getSubscriberOfType(FileSystemBackgroundSessionHandler.self))
  private lazy var taskHandlersManager = EXTaskHandlersManager()

  private lazy var documentDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
  private lazy var cacheDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first

  private lazy var backgroundSession = createUrlSession(type: .background, delegate: sessionTaskDispatcher)
  private lazy var foregroundSession = createUrlSession(type: .foreground, delegate: sessionTaskDispatcher)

  public func definition() -> ModuleDefinition {
    Name("ExponentFileSystem")

    Constants {
      return [
        "documentDirectory": documentDirectory,
        "cacheDirectory": cacheDirectory,
        "bundleDirectory": Bundle.main.bundlePath
      ]
    }

    Events(EVENT_DOWNLOAD_PROGRESS, EVENT_UPLOAD_PROGRESS)

    AsyncFunction("getInfoAsync") { (url: URL, options: InfoOptions, promise: Promise) in
      switch url.scheme {
      case "file":
        EXFileSystemLocalFileHandler.getInfoForFile(url, withOptions: options.toDictionary(), resolver: promise.resolver, rejecter: promise.legacyRejecter)
      case "assets-library", "ph":
        EXFileSystemAssetLibraryHandler.getInfoForFile(url, withOptions: options.toDictionary(), resolver: promise.resolver, rejecter: promise.legacyRejecter)
      default:
        throw UnsupportedSchemeException(url.scheme)
      }
    }

    AsyncFunction("readAsStringAsync") { (url: URL, options: ReadingOptions) -> String in
      try ensurePathPermission(path: url.path, flag: .read)

      if options.encoding == .base64 {
        return try readFileAsBase64(path: url.path, options: options)
      }
      do {
        return try String(contentsOfFile: url.path, encoding: options.encoding.toStringEncoding() ?? .utf8)
      } catch {
        throw FileNotReadableException(url.path)
      }
    }

    AsyncFunction("writeAsStringAsync") { (url: URL, string: String, options: WritingOptions) in
      try ensurePathPermission(path: url.path, flag: .write)

      if options.encoding == .base64 {
        try writeFileAsBase64(path: url.path, string: string)
      }
      do {
        try string.write(toFile: url.path, atomically: true, encoding: options.encoding.toStringEncoding() ?? .utf8)
      } catch {
        throw FileNotWritableException(url.path)
          .causedBy(error)
      }
    }

    AsyncFunction("deleteAsync") { (url: URL, options: DeletingOptions) in
      guard url.isFileURL else {
        throw InvalidFileUrlException(url)
      }
      try removeFile(path: url.path, idempotent: options.idempotent)
    }

    AsyncFunction("moveAsync") { (options: RelocatingOptions) in
      let (fromUrl, toUrl) = try options.asTuple()

      guard fromUrl.isFileURL else {
        throw InvalidFileUrlException(fromUrl)
      }
      guard toUrl.isFileURL else {
        throw InvalidFileUrlException(toUrl)
      }

      try ensurePathPermission(path: fromUrl.appendingPathComponent("..").path, flag: .write)
      try ensurePathPermission(path: toUrl.path, flag: .write)
      try removeFile(path: toUrl.path, idempotent: true)
      try FileManager.default.moveItem(atPath: fromUrl.path, toPath: toUrl.path)
    }

    AsyncFunction("copyAsync") { (options: RelocatingOptions, promise: Promise) in
      let (fromUrl, toUrl) = try options.asTuple()

      try ensurePathPermission(path: fromUrl.path, flag: .read)
      try ensurePathPermission(path: toUrl.path, flag: .write)

      if fromUrl.scheme == "file" {
        EXFileSystemLocalFileHandler.copy(from: fromUrl, to: toUrl, resolver: promise.resolver, rejecter: promise.legacyRejecter)
      } else if ["ph", "assets-library"].contains(fromUrl.scheme) {
        EXFileSystemAssetLibraryHandler.copy(from: fromUrl, to: toUrl, resolver: promise.resolver, rejecter: promise.legacyRejecter)
      } else {
        throw InvalidFileUrlException(fromUrl)
      }
    }

    AsyncFunction("makeDirectoryAsync") { (url: URL, options: MakeDirectoryOptions) in
      guard url.isFileURL else {
        throw InvalidFileUrlException(url)
      }

      try ensurePathPermission(path: url.path, flag: .write)
      try FileManager.default.createDirectory(at: url, withIntermediateDirectories: options.intermediates, attributes: nil)
    }

    AsyncFunction("readDirectoryAsync") { (url: URL) -> [String] in
      guard url.isFileURL else {
        throw InvalidFileUrlException(url)
      }
      try ensurePathPermission(path: url.path, flag: .read)

      return try FileManager.default.contentsOfDirectory(atPath: url.path)
    }

    AsyncFunction("downloadAsync") { (sourceUrl: URL, localUrl: URL, options: DownloadOptions, promise: Promise) in
      try ensureFileDirectoryExists(localUrl)
      try ensurePathPermission(path: localUrl.path, flag: .write)

      let session = options.sessionType == .background ? backgroundSession : foregroundSession
      let request = createUrlRequest(url: sourceUrl, headers: options.headers)
      let downloadTask = session.downloadTask(with: request)
      let taskDelegate = EXSessionDownloadTaskDelegate(
        resolve: promise.resolver,
        reject: promise.legacyRejecter,
        localUrl: localUrl,
        shouldCalculateMd5: options.md5
      )

      sessionTaskDispatcher.register(taskDelegate, for: downloadTask)
      downloadTask.resume()
    }

    AsyncFunction("uploadAsync") { (targetUrl: URL, localUrl: URL, options: UploadOptions, promise: Promise) in
      guard localUrl.isFileURL else {
        throw InvalidFileUrlException(localUrl)
      }
      guard FileManager.default.fileExists(atPath: localUrl.path) else {
        throw FileNotExistsException(localUrl.path)
      }
      let session = options.sessionType == .background ? backgroundSession : foregroundSession
      let task = createUploadTask(session: session, targetUrl: targetUrl, sourceUrl: localUrl, options: options)
      let taskDelegate = EXSessionUploadTaskDelegate(resolve: promise.resolver, reject: promise.legacyRejecter)

      sessionTaskDispatcher.register(taskDelegate, for: task)
      task.resume()
    }

    AsyncFunction("uploadTaskStartAsync") { (targetUrl: URL, localUrl: URL, uuid: String, options: UploadOptions, promise: Promise) in
      let session = options.sessionType == .background ? backgroundSession : foregroundSession
      let task = createUploadTask(session: session, targetUrl: targetUrl, sourceUrl: localUrl, options: options)
      let onSend: EXUploadDelegateOnSendCallback = { [weak self] _, _, totalBytesSent, totalBytesExpectedToSend in
        self?.sendEvent(EVENT_UPLOAD_PROGRESS, [
          "uuid": uuid,
          "data": [
            "totalBytesSent": totalBytesSent,
            "totalBytesExpectedToSend": totalBytesExpectedToSend
          ]
        ])
      }
      let taskDelegate = EXSessionCancelableUploadTaskDelegate(
        resolve: promise.resolver,
        reject: promise.legacyRejecter,
        onSendCallback: onSend,
        resumableManager: taskHandlersManager,
        uuid: uuid
      )

      sessionTaskDispatcher.register(taskDelegate, for: task)
      taskHandlersManager.register(task, uuid: uuid)
      task.resume()
    }

    AsyncFunction("downloadResumableStartAsync") { (sourceUrl: URL, localUrl: URL, uuid: String, options: DownloadOptions, resumeDataString: String?, promise: Promise) in
      try ensureFileDirectoryExists(localUrl)
      try ensurePathPermission(path: localUrl.path, flag: .write)

      let session = options.sessionType == .background ? backgroundSession : foregroundSession
      let resumeData = resumeDataString != nil ? Data(base64Encoded: resumeDataString ?? "") : nil
      let onWrite: EXDownloadDelegateOnWriteCallback = { [weak self] _, _, totalBytesWritten, totalBytesExpectedToWrite in
        self?.sendEvent(EVENT_DOWNLOAD_PROGRESS, [
          "uuid": uuid,
          "data": [
            "totalBytesWritten": totalBytesWritten,
            "totalBytesExpectedToWrite": totalBytesExpectedToWrite
          ]
        ])
      }
      let task: URLSessionDownloadTask

      if let resumeDataString, let resumeData = Data(base64Encoded: resumeDataString) {
        task = session.downloadTask(withResumeData: resumeData)
      } else {
        let request = createUrlRequest(url: sourceUrl, headers: options.headers)
        task = session.downloadTask(with: request)
      }

      let taskDelegate = EXSessionResumableDownloadTaskDelegate(
        resolve: promise.resolver,
        reject: promise.legacyRejecter,
        localUrl: localUrl,
        shouldCalculateMd5: options.md5,
        onWriteCallback: onWrite,
        resumableManager: taskHandlersManager,
        uuid: uuid
      )

      sessionTaskDispatcher.register(taskDelegate, for: task)
      taskHandlersManager.register(task, uuid: uuid)
      task.resume()
    }

    AsyncFunction("downloadResumablePauseAsync") { (id: String) -> [String: String?] in
      guard let task = taskHandlersManager.downloadTask(forId: id) else {
        throw DownloadTaskNotFoundException(id)
      }
      let resumeData = await task.cancelByProducingResumeData()

      return [
        "resumeData": resumeData?.base64EncodedString()
      ]
    }

    AsyncFunction("networkTaskCancelAsync") { (id: String) in
      taskHandlersManager.task(forId: id)?.cancel()
    }

    AsyncFunction("getFreeDiskStorageAsync") { () -> Int64 in
      let resourceValues = try getResourceValues(from: documentDirectory, forKeys: [.volumeAvailableCapacityForImportantUsageKey])

      guard let availableCapacity = resourceValues?.volumeAvailableCapacityForImportantUsage else {
        throw CannotDetermineDiskCapacity()
      }
      return availableCapacity
    }

    AsyncFunction("getTotalDiskCapacityAsync") { () -> Int in
      let resourceValues = try getResourceValues(from: documentDirectory, forKeys: [.volumeTotalCapacityKey])

      guard let totalCapacity = resourceValues?.volumeTotalCapacity else {
        throw CannotDetermineDiskCapacity()
      }
      return totalCapacity
    }
  }

  private func ensurePathPermission(path: String, flag: EXFileSystemPermissionFlags) throws {
    guard let permissionsManager: EXFilePermissionModuleInterface = appContext?.legacyModule(implementing: EXFilePermissionModuleInterface.self) else {
      throw Exceptions.FileSystemModuleNotFound()
    }
    guard permissionsManager.getPathPermissions(path).contains(flag) else {
      throw flag == .read ? FileNotReadableException(path) : FileNotWritableException(path)
    }
  }
}

func ensureFileDirectoryExists(_ fileUrl: URL) throws {
  let directoryPath = fileUrl.deletingLastPathComponent()

  if !FileManager.default.fileExists(atPath: directoryPath.path) {
    throw DirectoryNotExistsException(directoryPath.path)
  }
}

func readFileAsBase64(path: String, options: ReadingOptions) throws -> String {
  let file = FileHandle(forReadingAtPath: path)

  guard let file else {
    throw FileNotExistsException(path)
  }
  if let position = options.position {
    // TODO: Handle these errors?
    try? file.seek(toOffset: UInt64(position))
  }
  if let length = options.length {
    return file.readData(ofLength: length).base64EncodedString(options: .endLineWithLineFeed)
  }
  return file.readDataToEndOfFile().base64EncodedString(options: .endLineWithLineFeed)
}

func writeFileAsBase64(path: String, string: String) throws {
  let data = Data(base64Encoded: string, options: .ignoreUnknownCharacters)

  if !FileManager.default.createFile(atPath: path, contents: data) {
    throw FileWriteFailedException(path)
  }
}

func removeFile(path: String, idempotent: Bool = false) throws {
  if FileManager.default.fileExists(atPath: path) {
    do {
      try FileManager.default.removeItem(atPath: path)
    } catch {
      throw FileCannotDeleteException(path)
        .causedBy(error)
    }
  } else if !idempotent {
    throw FileCannotDeleteException(path)
      .causedBy(FileNotExistsException(path))
  }
}

func getResourceValues(from directory: URL?, forKeys: Set<URLResourceKey>) throws -> URLResourceValues? {
  do {
    return try directory?.resourceValues(forKeys: forKeys)
  } catch {
    throw CannotDetermineDiskCapacity().causedBy(error)
  }
}
