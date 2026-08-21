import ExpoModulesCore

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

      let shareURL = try prepareShareUrl(url: url, options: options)
      let stagedDirectory = shareURL == url ? nil : shareURL.deletingLastPathComponent()
      let activityController = UIActivityViewController(activityItems: [shareURL], applicationActivities: nil)
      activityController.title = options.dialogTitle

      // Strong self capture because we don't want to skip the deletion of the staging item, also
      // the .runOnMain captures strong self leading to warnings with weak self
      activityController.completionWithItemsHandler = { [self] _, _, _, _ in
        self.deleteStagedItemOrWarn(at: stagedDirectory)

        // Resolve unconditionally. UIActivityViewController invokes this once
        // on dismissal for every (activityType, completed) permutation. The
        // previous implementation only resolved two of four cases, leaking
        // the promise when the user picked an activity and then cancelled
        // its follow-up dialog (e.g. tapped Print, then cancelled the print
        // dialog: activityType != nil, completed == false).
        promise.resolve(nil)
      }

      guard let currentViewcontroller = appContext?.utilities?.currentViewController() else {
        self.deleteStagedItemOrWarn(at: stagedDirectory)
        throw MissingCurrentViewControllerException()
      }

      // Apple docs state that `UIActivityViewController` must be presented in a
      // popover on iPad https://developer.apple.com/documentation/uikit/uiactivityviewcontroller
      if UIDevice.current.userInterfaceIdiom == .pad {
        let rect = options.anchor
        let viewFrame = currentViewcontroller.view.frame

        activityController.popoverPresentationController?.sourceRect = CGRect(
          x: rect?.x ?? viewFrame.midX,
          y: rect?.y ?? viewFrame.maxY,
          width: rect?.width ?? 0,
          height: rect?.height ?? 0
        )
        activityController.popoverPresentationController?.sourceView = currentViewcontroller.view
        activityController.modalPresentationStyle = .pageSheet
      }

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

    guard let stagingDirectory = appContext.config.cacheDirectory?.appendingPathComponent("expo-sharing-tmp", isDirectory: true) else {
      appContext.jsLogger.warn(
        "expo-sharing: Failed to access app's cache directory. Sharing with the original url: \(url), which will ignore the passed type: \(contentType) "
      )
      return url
    }

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

  func deleteStagedItemOrWarn(at url: URL?) {
    guard let url else {
      return
    }
    do {
      try FileManager.default.removeItem(at: url)
    } catch {
      appContext?.jsLogger.warn(
        "expo-sharing: Failed to remove temporary sharing item at '\(url.absoluteString)': \(error.localizedDescription)"
      )
    }
  }
}
