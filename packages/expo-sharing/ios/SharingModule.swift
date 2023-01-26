import ExpoModulesCore

struct SharingContext {
  let pendingPromise: Promise
  let delegate: SharingDelegate
}

public final class SharingModule: Module, OnDocumentInteractionResult {
  private var documentInteractionController: UIDocumentInteractionController?
  private var sharingContext: SharingContext?

  public func definition() -> ModuleDefinition {
    Name("ExpoSharing")

    AsyncFunction("shareAsync") { (url: URL, options: SharingOptions, promise: Promise) in
      guard sharingContext == nil else {
        throw SharingInProgressException()
      }

      guard let filePermissions: EXFilePermissionModuleInterface =
              appContext?.legacyModule(implementing: EXFilePermissionModuleInterface.self)
      else {
        throw FilePermissionModuleException()
      }

      let grantedPermissions = filePermissions.getPathPermissions(url.absoluteString)
      guard grantedPermissions.rawValue <= EXFileSystemPermissionFlags.read.rawValue else {
        throw FilePermissionException()
      }

      let sharingDelegate = SharingDelegate(resultHandler: self)
      documentInteractionController = UIDocumentInteractionController(url: url)
      documentInteractionController?.delegate = sharingDelegate
      documentInteractionController?.uti = options.UTI

      guard let currentViewcontroller = appContext?.utilities?.currentViewController(),
            let rootView = currentViewcontroller.view,
            let documentInteractionController = documentInteractionController else {
        throw MissingCurrentViewControllerException()
      }

      if documentInteractionController.presentOpenInMenu(from: .zero, in: rootView, animated: true) {
        self.sharingContext = SharingContext(pendingPromise: promise, delegate: sharingDelegate)
      } else {
        self.documentInteractionController = nil
        throw UnsupportedTypeException()
      }
    }
    .runOnQueue(.main)
  }

  func didDismissOpenInMenu() {
    guard let promise = self.sharingContext?.pendingPromise else {
      log.error("Sharing context lost")
      return
    }

    promise.resolve(nil)
    self.sharingContext = nil
    self.documentInteractionController?.dismissMenu(animated: true)
    self.documentInteractionController = nil
  }
}
