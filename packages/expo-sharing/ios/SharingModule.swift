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

      let grantedPermissions = filePermissions.getPathPermissions(url.absoluteString)
      guard grantedPermissions.rawValue <= EXFileSystemPermissionFlags.read.rawValue else {
        throw FilePermissionException()
      }

      let activityController = UIActivityViewController(activityItems: [url], applicationActivities: nil)
      activityController.title = options.dialogTitle

      activityController.completionWithItemsHandler = { [weak self] _, _, _, error in
        guard let self else { return }

        if error != nil {
          promise.reject(UnsupportedTypeException())
        }

        promise.resolve(nil)
      }

      guard let currentViewcontroller = appContext?.utilities?.currentViewController() else {
        throw MissingCurrentViewControllerException()
      }

      currentViewcontroller.present(activityController, animated: true)
    }
    .runOnQueue(.main)
  }
}
