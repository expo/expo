import ExpoModulesCore

public final class SharingModule: Module {

  public func definition() -> ModuleDefinition {
    Name("ExpoSharing")

    AsyncFunction("shareAsync") { (url: URL, options: SharingOptions, promise: Promise) in
      guard let filePermissions: EXFilePermissionModuleInterface =
        appContext?.legacyModule(implementing: EXFilePermissionModuleInterface.self)
      else {
        throw FilePermissionModuleException()
      }

      let grantedPermissions = filePermissions.getPathPermissions(url.relativePath)
      guard grantedPermissions.rawValue >= EXFileSystemPermissionFlags.read.rawValue else {
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
        let viewFrame = currentViewcontroller.view.frame
        activityController.popoverPresentationController?.sourceRect = CGRect(
          x: viewFrame.midX,
          y: viewFrame.maxY,
          width: 0,
          height: 0
        )
        activityController.popoverPresentationController?.sourceView = currentViewcontroller.view
        activityController.modalPresentationStyle = .pageSheet
      }

      currentViewcontroller.present(activityController, animated: true)
    }
    .runOnQueue(.main)
  }
}
