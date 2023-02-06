// Copyright 2022-present 650 Industries. All rights reserved.

import PhotosUI

/**
 Protocol that describes scenarios we care about while the user is picking media.
 */
protocol OnMediaPickingResultHandler {
  @available(iOS 14, *)
  func didPickMultipleMedia(selection: [PHPickerResult])
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
                                   PHPickerViewControllerDelegate,
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

  @available(iOS 14, *)
  private func handlePickedMedia(selection: [PHPickerResult]) {
    statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    onMediaPickingResultHandler.didPickMultipleMedia(selection: selection)
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

  // MARK: - PHPickerViewControllerDelegate

  @available(iOS 14, *)
  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    DispatchQueue.main.async {
      picker.dismiss(animated: true) { [weak self] in
        // The PHPickerViewController returns empty collection when canceled
        if results.isEmpty {
          self?.handlePickingCancellation()
        } else {
          self?.handlePickedMedia(selection: results)
        }
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

/**
 Protocol that is a common type for supported picker controllers.
 */
internal protocol PickerUIController: UIViewController {
  func setResultHandler(_ handler: ImagePickerHandler)
}

extension UIImagePickerController: PickerUIController {
  func setResultHandler(_ handler: ImagePickerHandler) {
    self.delegate = handler
    self.presentationController?.delegate = handler
  }
}

@available(iOS 14, *)
extension PHPickerViewController: PickerUIController {
  func setResultHandler(_ handler: ImagePickerHandler) {
    self.delegate = handler
    self.presentationController?.delegate = handler
  }
}
