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
      let createdLink = itemURL != url

      let activityController = UIActivityViewController(activityItems: [itemURL], applicationActivities: nil)
      activityController.title = options.dialogTitle

      activityController.completionWithItemsHandler = { _, _, _, _ in
        if createdLink {
          try? FileManager.default.removeItem(at: itemURL)
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
    FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
    if isDirectory.boolValue {
      return url
    }

    guard let ext = declaredContentType(options)?.preferredFilenameExtension else {
      return url
    }
    if url.pathExtension.caseInsensitiveCompare(ext) == .orderedSame {
      return url
    }

    let baseName = url.deletingPathExtension().lastPathComponent
    let linkURL = FileManager.default.temporaryDirectory
      .appendingPathComponent(baseName.isEmpty ? "expo-sharing-item" : baseName)
      .appendingPathExtension(ext)

    do {
      if FileManager.default.fileExists(atPath: linkURL.path) {
        try FileManager.default.removeItem(at: linkURL)
      }
      try FileManager.default.linkItem(at: url, to: linkURL)
      return linkURL
    } catch {
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
