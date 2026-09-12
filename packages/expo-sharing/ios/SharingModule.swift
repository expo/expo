import ExpoModulesCore

public final class SharingModule: Module {
  private let cleanupQueue = DispatchQueue(label: "expo.sharing.cleanup", qos: .utility)
  private let stagingSessionId = UUID().uuidString
  private var completedStagedDirectories: [URL] = []

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

    OnCreate {
      cleanupPreviousStagingSessions()
    }

    AsyncFunction("shareAsync") { (url: URL, options: SharingOptions, promise: Promise) in
      cleanupCompletedStagedItems()

      guard FileSystemUtilities.isReadableFile(appContext, url) else {
        throw FilePermissionException()
      }

      let shareURL = try prepareShareUrl(url: url, options: options)
      let stagedDirectory = shareURL == url ? nil : shareURL.deletingLastPathComponent()
      let activityController = UIActivityViewController(activityItems: [shareURL], applicationActivities: nil)
      activityController.title = options.dialogTitle

      // weak self = self to avoid warnings
      activityController.completionWithItemsHandler = { [weak self = self] _, _, _, _ in
        if let stagedDirectory {
          self?.completedStagedDirectories.append(stagedDirectory)
        }

        // Resolve unconditionally. UIActivityViewController invokes this once
        // on dismissal for every (activityType, completed) permutation. The
        // previous implementation only resolved two of four cases, leaking
        // the promise when the user picked an activity and then cancelled
        // its follow-up dialog (e.g. tapped Print, then cancelled the print
        // dialog: activityType != nil, completed == false).
        promise.resolve(nil)
      }

      guard let currentViewcontroller = appContext?.utilities?.currentViewController() else {
        removeStagedItems([stagedDirectory].compactMap { $0 })
        throw MissingCurrentViewControllerException()
      }

      configurePopoverIfNeeded(activityController, from: currentViewcontroller, anchor: options.anchor)
      currentViewcontroller.present(activityController, animated: true)
    }
    .runOnQueue(.main)

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

  private func configurePopoverIfNeeded(
    _ activityController: UIActivityViewController,
    from viewController: UIViewController,
    anchor: SharingOptions.Rect?
  ) {
    guard UIDevice.current.userInterfaceIdiom == .pad else {
      return
    }

    let viewFrame = viewController.view.frame
    activityController.popoverPresentationController?.sourceRect = CGRect(
      x: anchor?.x ?? viewFrame.midX,
      y: anchor?.y ?? viewFrame.maxY,
      width: anchor?.width ?? 0,
      height: anchor?.height ?? 0
    )
    activityController.popoverPresentationController?.sourceView = viewController.view
    activityController.modalPresentationStyle = .pageSheet
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

  private func prepareShareUrl(url: URL, options: SharingOptions) throws -> URL {
    guard let contentType = declaredContentType(options), let ext = contentType.preferredFilenameExtension, ext != url.pathExtension else {
      return url
    }

    guard let appContext else {
      throw Exceptions.AppContextLost()
    }

    guard let stagingRoot = appContext.config.cacheDirectory?.appendingPathComponent("expo-sharing-tmp", isDirectory: true) else {
      appContext.jsLogger.warn(
        "expo-sharing: Failed to access app's cache directory. Sharing with the original url: \(url), which will ignore the passed type: \(contentType) "
      )
      return url
    }

    let stagingDirectory = stagingRoot.appendingPathComponent(stagingSessionId, isDirectory: true)

    // An explicitly declared type intentionally takes precedence over a conflicting filename extension.
    let baseName = url.lastPathComponent
    let linkDirectory = stagingDirectory
      .appendingPathComponent(UUID().uuidString, isDirectory: true)

    let linkURL = linkDirectory
      .appendingPathComponent(baseName.isEmpty ? "expo-sharing-item" : baseName)
      .appendingPathExtension(ext)

    do {
      try FileManager.default.createDirectory(at: linkDirectory, withIntermediateDirectories: true)
    } catch {
      appContext.jsLogger.warn(
        "expo-sharing: Failed to create a temporary directory at \(linkDirectory) used for applying the requested content type." +
        " The declared type of \(contentType) will be ignored. Error: \(error.localizedDescription)"
      )
      return url
    }

    do {
      try linkOrCopyItem(at: url, to: linkURL)
      return linkURL
    } catch {
      try? FileManager.default.removeItem(at: linkDirectory)
      appContext.jsLogger.warn(
        "expo-sharing: Failed to stage '\(url.lastPathComponent)' with the declared type: \(contentType)." +
        " The provided type will be ignored. Error: \(error.localizedDescription)"
      )
    }
    return url
  }

  private func declaredContentType(_ options: SharingOptions) -> UTType? {
    if let uti = options.UTI, let type = UTType(uti), type.preferredFilenameExtension != nil {
      return type
    }
    if let mimeType = options.mimeType, let type = UTType(mimeType: mimeType), type.preferredFilenameExtension != nil {
      return type
    }
    return nil
  }

  private func linkOrCopyItem(at url: URL, to linkOrCopyUrl: URL) throws {
    do {
      try FileManager.default.linkItem(at: url, to: linkOrCopyUrl)
    } catch {
      // Hard links cannot span volumes (`EXDEV`), which is reachable for URLs
      // vended by a file provider. Copying costs an actual duplicate of the
      // file, but it is the only way to honor the declared type in that case.
      try FileManager.default.copyItem(at: url, to: linkOrCopyUrl)
    }
  }

  private func cleanupPreviousStagingSessions() {
    guard let stagingRoot = appContext?.config.cacheDirectory?.appendingPathComponent("expo-sharing-tmp", isDirectory: true) else {
      return
    }

    let stagingSessionId = self.stagingSessionId
    cleanupQueue.async {
      let directories = try? FileManager.default.contentsOfDirectory(
        at: stagingRoot,
        includingPropertiesForKeys: nil
      )
      directories?.filter { $0.lastPathComponent != stagingSessionId }.forEach {
        try? FileManager.default.removeItem(at: $0)
      }
    }
  }

  private func cleanupCompletedStagedItems() {
    let directories = completedStagedDirectories
    completedStagedDirectories.removeAll()
    removeStagedItems(directories)
  }

  private func removeStagedItems(_ directories: [URL]) {
    cleanupQueue.async {
      directories.forEach { try? FileManager.default.removeItem(at: $0) }
    }
  }
}
