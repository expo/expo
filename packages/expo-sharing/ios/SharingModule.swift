import ExpoModulesCore
import UniformTypeIdentifiers

public final class SharingModule: Module {
  private var appGroupId: String {
    get throws {
      guard let groupId = Bundle.main.object(forInfoDictionaryKey: "ExpoShareIntoAppGroupId") as? String else {
        throw FailedToResolveAppGroupIdException()
      }
      return groupId
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoSharing")

    AsyncFunction("shareAsync") { (url: URL, options: SharingOptions, promise: Promise) in
      guard FileSystemUtilities.isReadableFile(appContext, url) else {
        throw FilePermissionException()
      }

      // `UIActivityViewController` derives the shared item's type (and preview)
      // from the file's extension. Cached files often have no extension, so when
      // the caller declares a content type via `UTI`/`mimeType` we expose the
      // file under a correctly-named hard link. A hard link is a second name for
      // the same on-disk data, so this costs no copy and behaves as a real file
      // for every consumer.
      let itemURL = shareableURL(for: url, options: options)
      let linkDirectory = itemURL == url ? nil : itemURL.deletingLastPathComponent()

      DispatchQueue.main.async {
        let session = ShareSheetSession(promise: promise, stagedDirectory: linkDirectory)

        guard let currentViewController = self.appContext?.utilities?.currentViewController() else {
          session.reject(MissingCurrentViewControllerException())
          return
        }

        let activityController = UIActivityViewController(activityItems: [itemURL], applicationActivities: nil)
        activityController.title = options.dialogTitle

        activityController.completionWithItemsHandler = { _, _, _, _ in
          // Resolve unconditionally. UIActivityViewController invokes this once
          // on dismissal for every (activityType, completed) permutation.
          session.resolve()
        }

        // Apple docs state that `UIActivityViewController` must be presented in a
        // popover on iPad https://developer.apple.com/documentation/uikit/uiactivityviewcontroller
        if UIDevice.current.userInterfaceIdiom == .pad {
          let rect = options.anchor
          let viewFrame = currentViewController.view.frame

          activityController.popoverPresentationController?.sourceRect = CGRect(
            x: rect?.x ?? viewFrame.midX,
            y: rect?.y ?? viewFrame.maxY,
            width: rect?.width ?? 0,
            height: rect?.height ?? 0
          )
          activityController.popoverPresentationController?.sourceView = currentViewController.view
          activityController.modalPresentationStyle = .pageSheet
        }

        currentViewController.present(activityController, animated: true)
      }
    }

    // MARK: - Share into

    Function("getSharedPayloads") {
      let rawPayloads = try getSharePayloads(appGroupId: appGroupId)
      return rawPayloads.map { ExpoSharePayload(from: $0).toDictionary() }
    }

    AsyncFunction("getResolvedSharedPayloadsAsync") {
      let rawPayloads = try getSharePayloads(appGroupId: appGroupId)

      return try await withThrowingTaskGroup(of: (Int, ExpoResolvedSharePayload).self) { [weak self] group in
        guard let self else {
          return []
        }

        for (index, rawPayload) in rawPayloads.enumerated() {
          group.addTask {
            let resolved = try await ExpoResolvedSharePayload.resolve(from: rawPayload)
            return (index, resolved)
          }
        }

        var results = [ExpoResolvedSharePayload?](repeating: nil, count: rawPayloads.count)
        for try await (index, resolved) in group {
          results[index] = resolved
        }

        return results.compactMap { $0?.toDictionary() }
      }
    }

    Function("clearSharedPayloads") {
      try UserDefaults(suiteName: appGroupId)?.removeObject(forKey: SHARE_INTO_DEFAULTS_KEY)
    }
  }

  private func declaredContentType(_ options: SharingOptions) -> UTType? {
    if let uti = options.UTI, let type = UTType(uti) {
      return type
    }
    if let mimeType = options.mimeType, let type = UTType(mimeType: mimeType) {
      return type
    }
    return nil
  }

  private func shareableURL(for url: URL, options: SharingOptions) -> URL {
    var isDirectory: ObjCBool = false
    guard FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory), !isDirectory.boolValue else {
      return url
    }

    guard let type = declaredContentType(options), let ext = type.preferredFilenameExtension else {
      return url
    }

    if let currentType = UTType(filenameExtension: url.pathExtension), currentType.conforms(to: type) {
      return url
    }

    let baseName = url.deletingPathExtension().lastPathComponent
    let linkDirectory = FileManager.default.temporaryDirectory
      .appendingPathComponent("expo-sharing", isDirectory: true)
      .appendingPathComponent(UUID().uuidString, isDirectory: true)
    let linkURL = linkDirectory
      .appendingPathComponent(baseName.isEmpty ? "expo-sharing-item" : baseName)
      .appendingPathExtension(ext)

    do {
      try FileManager.default.createDirectory(at: linkDirectory, withIntermediateDirectories: true)
      do {
        try FileManager.default.linkItem(at: url, to: linkURL)
      } catch {
        // Hard links cannot span volumes (`EXDEV`), which is reachable for URLs
        // vended by a file provider. Copying costs an actual duplicate of the
        // file, but it is the only way to honor the declared type in that case.
        try FileManager.default.copyItem(at: url, to: linkURL)
      }
      return linkURL
    } catch {
      try? FileManager.default.removeItem(at: linkDirectory)
      return url
    }
  }

  private func getSharePayloads(appGroupId: String) -> [SharePayload] {
    let userDefaults = UserDefaults(suiteName: appGroupId)

    guard let data = userDefaults?.data(forKey: SHARE_INTO_DEFAULTS_KEY),
    let rawPayloads = try? JSONDecoder().decode([SharePayload].self, from: data)
    else {
      return []
    }

    return rawPayloads
  }
}

private final class ShareSheetSession {
  private let promise: Promise
  private let stagedDirectory: URL?
  private var isSettled = false

  init(promise: Promise, stagedDirectory: URL?) {
    self.promise = promise
    self.stagedDirectory = stagedDirectory
  }

  func resolve() {
    settle {
      promise.resolve(nil)
    }
  }

  func reject(_ exception: Exception) {
    settle {
      promise.reject(exception)
    }
  }

  deinit {
    guard !isSettled else {
      return
    }
    cleanup()
    promise.reject(FailedToPresentShareSheetException())
  }

  private func settle(_ action: () -> Void) {
    guard !isSettled else {
      return
    }
    isSettled = true
    cleanup()
    action()
  }

  private func cleanup() {
    if let stagedDirectory {
      try? FileManager.default.removeItem(at: stagedDirectory)
    }
  }
}
