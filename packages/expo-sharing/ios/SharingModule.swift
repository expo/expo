import ExpoModulesCore

public final class SharingModule: Module {

  public func definition() -> ModuleDefinition {
    Name("ExpoSharing")

    AsyncFunction("shareAsync") { (url: URL, options: SharingOptions) in
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

      guard let currentViewcontroller = appContext?.utilities?.currentViewController() else {
        throw MissingCurrentViewControllerException()
      }

      currentViewcontroller.present(activityController, animated: true)
    }
    .runOnQueue(.main)
  }
}
