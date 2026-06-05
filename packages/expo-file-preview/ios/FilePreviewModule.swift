import ExpoModulesCore
import QuickLook
import UIKit

public final class FilePreviewModule: Module {
  private var previewSession: FilePreviewSession?
  private var isPresenting = false

  public func definition() -> ModuleDefinition {
    Name("ExpoFilePreview")

    AsyncFunction("canPreviewAsync") { (uri: URL, _: FilePreviewCanPreviewOptions) -> Bool in
      guard uri.isFileURL else {
        throw FilePreviewInvalidUriException(uri)
      }
      guard FileSystemUtilities.isReadableFile(appContext, uri) else {
        throw FilePreviewPermissionException()
      }
      return QLPreviewController.canPreview(FilePreviewItem(url: uri, title: nil))
    }
    .runOnQueue(.main)

    AsyncFunction("openPreviewAsync") { (uri: URL, options: FilePreviewOpenOptions, promise: Promise) in
      guard !isPresenting else {
        throw FilePreviewInProgressException()
      }
      guard uri.isFileURL else {
        throw FilePreviewInvalidUriException(uri)
      }
      guard FileSystemUtilities.isReadableFile(appContext, uri) else {
        throw FilePreviewPermissionException()
      }
      guard let currentViewController = appContext?.utilities?.currentViewController() else {
        throw FilePreviewMissingCurrentViewControllerException()
      }

      let item = FilePreviewItem(url: uri, title: options.title)
      guard QLPreviewController.canPreview(item) else {
        throw FilePreviewUnsupportedException(uri)
      }

      let previewController = QLPreviewController()
      let session = FilePreviewSession(item: item) { [weak self] in
        self?.previewSession = nil
        self?.isPresenting = false
      }
      previewSession = session
      isPresenting = true
      previewController.dataSource = session
      previewController.delegate = session

      currentViewController.present(previewController, animated: true) {
        promise.resolve()
      }
    }
    .runOnQueue(.main)
  }
}
