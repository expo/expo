// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Protocol that describes scenarios we care about while the user is picking media.
 */
protocol OnMediaPickingResultHandler {
  func didPickedMedia(mediaInfo: MediaInfo) -> Void
  func didCancelPicking() -> Void
}

/**
 This delegate is responsible for responing to any events that are happening in `UIImagePickerController`.
 It then forward them back in unified way via `ImagePickerResultHandlerDelegate`.

 The functionality of this delegate is separated from the main module class for two reasons:
 1) main module cannot inherit from `NSObject` (and that's required by three protocols we must conform to),
 because it already inhertis from `Module` class and Swift language does not allow multiple inheritance,
 2) it separates some logic from the main module class and hopefully makes it cleaner.
 */
internal class ImagePickerDelegate: NSObject,
                                    UINavigationControllerDelegate,
                                    UIImagePickerControllerDelegate,
                                    UIAdaptivePresentationControllerDelegate {

  private let onMediaPickingResultHandler: OnMediaPickingResultHandler
  private let hideStatusBarWhenPreseted: Bool
  private var statusBarVisibilityController = StatusBarVisibilityController()
  
  init(onMediaPickingResultHandler: OnMediaPickingResultHandler, hideStatusBarWhenPresented: Bool) {
    self.onMediaPickingResultHandler = onMediaPickingResultHandler
    self.hideStatusBarWhenPreseted = hideStatusBarWhenPresented
  }
  
  private func handlePickedMedia(mediaInfo: MediaInfo) {
    self.statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    self.onMediaPickingResultHandler.didPickedMedia(mediaInfo: mediaInfo)
  }
  
  private func handlePickingCancellation() {
    self.statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    self.onMediaPickingResultHandler.didCancelPicking()
  }
  
  
// MARK: UIImagePickerControllerDelegate
  
  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: MediaInfo) {
    DispatchQueue.main.async {
      picker.dismiss(animated: true) {
        self.handlePickedMedia(mediaInfo: info)
      }
    }
  }

  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    DispatchQueue.main.async {
      picker.dismiss(animated: true) {
        self.handlePickingCancellation()
      }
    }
  }
  
// MARK: UIAdaptivePresentationControllerDelegate
  
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    self.handlePickingCancellation()
  }
  
// MARK: UINavigationControllerDelegate
  
  func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
    self.statusBarVisibilityController.maybePreserveVisbilityAndHideStatusBar(self.hideStatusBarWhenPreseted)
  }
}
