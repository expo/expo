import ExpoModulesCore

public final class SharingModule: Module {

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
  }
}
