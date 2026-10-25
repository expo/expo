// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
#if os(iOS)
import QuickLook
#endif

@available(iOS 14, tvOS 14, *)
public final class FileSystemModule: Module {
  #if os(iOS)
  private lazy var filePickingHandler = FilePickingHandler(module: self)
  private var isPresentingPreview = false
  private weak var previewController: QLPreviewController?
  private var deferredPreview: (files: [FileSystemFile], options: FilePreviewOptions?, initialIndex: Int, promise: Promise)?
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

  private func writeToFile(
    _ file: FileSystemFile,
    content: Either<String, NativeArrayBuffer>,
    options: WriteOptions?
  ) throws {
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
    } else if let content: NativeArrayBuffer = content.get() {
      try file.write(content, append: append)
    }
  }

  #if os(iOS)
  private func canPreview(file: FileSystemFile) throws -> Bool {
    return try file.withCorrectTypeAndScopedAccess(permission: .read) {
      guard file.exists else {
        return false
      }
      return QLPreviewController.canPreview(FileSystemPreviewItem(url: file.url, title: nil))
    }
  }

  private func requestPreview(
    files: [FileSystemFile], options: FilePreviewOptions?, initialIndex: Int, promise: Promise
  ) throws {
    if isPresentingPreview {
      guard deferPreviewUntilDismissal(files: files, options: options, initialIndex: initialIndex, promise: promise) else {
        throw FilePreviewInProgressException()
      }
    } else {
      try presentPreview(files: files, options: options, initialIndex: initialIndex, promise: promise)
    }
  }

  private func presentPreview(
    files: [FileSystemFile], options: FilePreviewOptions?, initialIndex: Int, promise: Promise
  ) throws {
    guard let currentViewController = appContext?.utilities?.currentViewController() else {
      throw FilePreviewMissingViewControllerException()
    }

    var scopedAccesses: [FileSystemScopedAccess] = []
    var items: [FileSystemPreviewItem] = []
    for file in files {
      // Retain access while validating the collection and until Quick Look closes.
      scopedAccesses.append(try makeScopedAccess(for: file, permission: .read))
      guard file.exists else {
        throw FilePreviewFileNotFoundException(file.url)
      }
      let item = FileSystemPreviewItem(url: file.url, title: options?.title)
      guard QLPreviewController.canPreview(item) else {
        throw FilePreviewUnsupportedException(file.url)
      }
      items.append(item)
    }

    let previewController = FileSystemPreviewController()
    let session = FileSystemPreviewSession(items: items, scopedAccesses: scopedAccesses) { [weak self] in
      guard let self else {
        return
      }
      self.isPresentingPreview = false
      self.previewController = nil

      guard let deferredPreview = self.deferredPreview else {
        return
      }
      self.deferredPreview = nil
      do {
        try self.presentPreview(
          files: deferredPreview.files,
          options: deferredPreview.options,
          initialIndex: deferredPreview.initialIndex,
          promise: deferredPreview.promise
        )
      } catch {
        deferredPreview.promise.reject(error)
      }
    }
    previewController.session = session
    previewController.onPresentationFailure = { [weak self] in
      self?.isPresentingPreview = false
      self?.previewController = nil
      promise.reject(FilePreviewPresentationException())
    }
    isPresentingPreview = true
    self.previewController = previewController
    previewController.dataSource = session
    previewController.delegate = session
    previewController.currentPreviewItemIndex = initialIndex

    currentViewController.present(previewController, animated: true) { [weak previewController] in
      previewController?.onPresentationFailure = nil
      promise.resolve()
    }
  }

  private func deferPreviewUntilDismissal(
    files: [FileSystemFile],
    options: FilePreviewOptions?,
    initialIndex: Int,
    promise: Promise
  ) -> Bool {
    guard deferredPreview == nil,
      let previewController,
      previewController.isBeingDismissed,
      let transitionCoordinator = previewController.transitionCoordinator else {
      return false
    }

    deferredPreview = (files, options, initialIndex, promise)

    if transitionCoordinator.isInteractive {
      transitionCoordinator.notifyWhenInteractionChanges { [weak self] context in
        guard context.isCancelled else {
          return
        }
        self?.rejectDeferredPreview()
      }
    }
    return true
  }

  private func rejectDeferredPreview() {
    guard let deferredPreview else {
      return
    }
    self.deferredPreview = nil
    deferredPreview.promise.reject(FilePreviewInProgressException())
  }
  #endif

  public func definition() -> ModuleDefinition {
    Name("FileSystem")

    Events("downloadProgress")

    #if os(iOS)
    OnDestroy {
      rejectDeferredPreview()
    }
    #endif

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

    AsyncFunction("canPreview") { (files: [FileSystemFile]) -> Bool in
      #if os(iOS)
      guard !files.isEmpty else {
        throw FilePreviewInvalidInputException("At least one file is required for a preview.")
      }
      return try files.allSatisfy { try canPreview(file: $0) }
      #else
      throw FeatureNotAvailableOnPlatformException()
      #endif
    }.runOnQueue(.main)

    AsyncFunction("preview") { (files: [FileSystemFile], initialIndex: Double, promise: Promise) in
      #if os(iOS)
      do {
        guard let initialIndex = Int(exactly: initialIndex),
          files.indices.contains(initialIndex) else {
          throw FilePreviewInvalidInputException("initialIndex must be an integer within a nonempty preview collection.")
        }
        try requestPreview(files: files, options: nil, initialIndex: initialIndex, promise: promise)
      } catch {
        promise.reject(error)
      }
      #else
      promise.reject(FeatureNotAvailableOnPlatformException())
      #endif
    }.runOnQueue(.main)

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

      AsyncFunction("canPreview") { (file: FileSystemFile, _: FilePreviewOptions?) -> Bool in
        #if os(iOS)
        return try canPreview(file: file)
        #else
        throw FeatureNotAvailableOnPlatformException()
        #endif
      }
      .runOnQueue(.main)

      AsyncFunction("preview") { (file: FileSystemFile, options: FilePreviewOptions?, promise: Promise) in
        #if os(iOS)
        do {
          try requestPreview(files: [file], options: options, initialIndex: 0, promise: promise)
        } catch {
          promise.reject(error)
        }
        #else
        promise.reject(FeatureNotAvailableOnPlatformException())
        #endif
      }
      .runOnQueue(.main)

      Function("info") { (file: FileSystemFile, options: InfoOptions?) in
        return try file.info(options: options ?? InfoOptions())
      }

      AsyncFunction("digest") { (file: FileSystemFile, algorithm: String) in
        return try file.digest(algorithm: algorithm)
      }

      AsyncFunction("write") { (file: FileSystemFile, content: Either<String, NativeArrayBuffer>, options: WriteOptions?) in
        try writeToFile(file, content: content, options: options)
      }

      Function("writeSync") { (file: FileSystemFile, content: Either<String, NativeArrayBuffer>, options: WriteOptions?) in
        try writeToFile(file, content: content, options: options)
      }

      Property("size") { file in
        (try? file.size) ?? 0
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
      AsyncFunction("readBytes") { (fileHandle, bytes: Int) in
        try fileHandle.read(bytes)
      }

      Function("readBytesSync") { (fileHandle, bytes: Int) in
        try fileHandle.read(bytes)
      }

      AsyncFunction("writeBytes") { (fileHandle, bytes: Data) in
        try fileHandle.write(bytes)
      }

      Function("writeBytesSync") { (fileHandle, bytes: Data) in
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

    Class(FileSystemUploadTask.self) {
      Constructor {
        return FileSystemUploadTask()
      }

      AsyncFunction("start") { (task: FileSystemUploadTask, url: URL, file: FileSystemFile, options: UploadTaskOptions, promise: Promise) in
        task.start(url: url, file: file, options: options, promise: promise)
      }

      Function("cancel") { (task: FileSystemUploadTask) in
        task.cancel()
      }
    }

    Class(FileSystemDownloadTask.self) {
      Constructor {
        return FileSystemDownloadTask()
      }

      AsyncFunction("start") { (task: FileSystemDownloadTask, url: URL, to: FileSystemPath, options: DownloadTaskOptions?, promise: Promise) in
        try to.validatePermission(.write)
        task.start(url: url, to: to, options: options, promise: promise)
      }.runOnQueue(.main)

      AsyncFunction("pause") { (task: FileSystemDownloadTask) -> [String: String?] in
        return await task.pause()
      }

      AsyncFunction("resume") { (task: FileSystemDownloadTask, url: URL, to: FileSystemPath, resumeData: String, options: DownloadTaskOptions?, promise: Promise) in
        try to.validatePermission(.write)
        task.resume(url: url, to: to, resumeData: resumeData, options: options, promise: promise)
      }.runOnQueue(.main)

      AsyncFunction("acknowledgeBackgroundCompletionAsync") { (task: FileSystemDownloadTask) in
        try task.acknowledgeBackgroundCompletion()
      }.runOnQueue(.main)

      Function("cancel") { (task: FileSystemDownloadTask) in
        task.cancel()
      }
    }

    Class(FileSystemWatcher.self) {
      Constructor { (path: URL, options: WatchOptions?) in
        try FileSystemWatcher(path: path, options: options)
      }

      Function("start") { watcher in
        watcher.start()
      }

      Function("stop") { watcher in
        watcher.stop()
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
