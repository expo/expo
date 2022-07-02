// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Protocol that describes scenarios we care about while the user is picking media.
 */
protocol OnMediaPickingResultHandler {
  func didPickMedia(mediaInfo: MediaInfo)
  func didCancelPicking()
}

/**
 This class is responsible for responding to any events that are happening in `UIImagePickerController`.
 It then forwards them back in unified way via `OnMediaPickingResultHandler`.

 The functionality of this delegate is separated from the main module class for two reasons:
 1) main module cannot inherit from `NSObject` (and that's required by three protocols we must conform to),
 because it already inherits from `Module` class and Swift language does not allow multiple inheritance,
 2) it separates some logic from the main module class and hopefully makes it cleaner.
 */
internal class ImagePickerHandler: NSObject,
                                   UINavigationControllerDelegate,
                                   UIImagePickerControllerDelegate,
                                   UIAdaptivePresentationControllerDelegate {
  private let onMediaPickingResultHandler: OnMediaPickingResultHandler
  private let hideStatusBarWhenPresented: Bool
  private var statusBarVisibilityController = StatusBarVisibilityController()

  init(onMediaPickingResultHandler: OnMediaPickingResultHandler, hideStatusBarWhenPresented: Bool) {
    self.onMediaPickingResultHandler = onMediaPickingResultHandler
    self.hideStatusBarWhenPresented = hideStatusBarWhenPresented
  }

  private func handlePickedMedia(mediaInfo: MediaInfo) {
    statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    onMediaPickingResultHandler.didPickMedia(mediaInfo: mediaInfo)
  }

  private func handlePickingCancellation() {
    statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    onMediaPickingResultHandler.didCancelPicking()
  }

  // MARK: - UIImagePickerControllerDelegate

  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: MediaInfo) {
    DispatchQueue.main.async {
      picker.dismiss(animated: true) { [weak self] in
        self?.handlePickedMedia(mediaInfo: info)
      }
    }
  }

  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    DispatchQueue.main.async {
      picker.dismiss(animated: true) { [weak self] in
        self?.handlePickingCancellation()
      }
    }
  }

  // MARK: - UIAdaptivePresentationControllerDelegate

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    handlePickingCancellation()
  }

  // MARK: - UINavigationControllerDelegate

  func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
    statusBarVisibilityController.maybePreserveVisibilityAndHideStatusBar(hideStatusBarWhenPresented)
  }
}
