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
      let grantedPermissions = FileSystemUtilities.permissions(appContext, for: url)

      guard grantedPermissions.contains(.read) && FileManager.default.isReadableFile(atPath: url.path) else {
        throw FilePermissionException()
      }

      let activityController = UIActivityViewController(activityItems: [url], applicationActivities: nil)
      activityController.title = options.dialogTitle

      activityController.completionWithItemsHandler = { type, completed, _, _ in
        // user shared an item
        if type != nil && completed {
          promise.resolve(nil)
        }

        // dismissed without action
        if type == nil && !completed {
          promise.resolve(nil)
        }
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
