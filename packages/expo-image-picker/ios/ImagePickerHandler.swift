// Copyright 2022-present 650 Industries. All rights reserved.

import PhotosUI

/**
 Protocol that describes scenarios we care about while the user is picking media.
 */
protocol OnMediaPickingResultHandler {
  /// `dismissPicker` closes the picker and runs its argument once it is gone. It must be called exactly once.
  func didPickMultipleMedia(selection: [PHPickerResult], dismissPicker: @escaping (@escaping () -> Void) -> Void)
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

  private func handlePickedMedia(selection: [PHPickerResult], picker: PHPickerViewController) {
    statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    onMediaPickingResultHandler.didPickMultipleMedia(selection: selection) { completion in
      DispatchQueue.main.async {
        picker.dismiss(animated: true, completion: completion)
      }
    }
  }

  /**
   Covers the picker with a spinner and blocks input while the selection loads. A photo that lives
   only in iCloud is downloaded at this point, which can take seconds; without this the picker
   closed immediately and the app showed nothing until the download finished.
   */
  private func showLoadingOverlay(on picker: PHPickerViewController) {
    // Swipe-to-dismiss would otherwise close the picker mid-download.
    picker.isModalInPresentation = true

    let overlay = UIView(frame: picker.view.bounds)
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.backgroundColor = UIColor.black.withAlphaComponent(0.4)

    let spinner = UIActivityIndicatorView(style: .large)
    spinner.color = .white
    spinner.translatesAutoresizingMaskIntoConstraints = false
    spinner.startAnimating()
    overlay.addSubview(spinner)
    NSLayoutConstraint.activate([
      spinner.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
      spinner.centerYAnchor.constraint(equalTo: overlay.centerYAnchor)
    ])

    picker.view.addSubview(overlay)
  }

  private func handlePickingCancellation() {
    statusBarVisibilityController.maybeRestoreStatusBarVisibility()
    onMediaPickingResultHandler.didCancelPicking()
  }

  // MARK: - UIImagePickerControllerDelegate

  func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: MediaInfo) {
    handlePickedMedia(mediaInfo: info)
    picker.dismiss(animated: true)
  }

  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    handlePickingCancellation()
    picker.dismiss(animated: true)
  }

  // MARK: - PHPickerViewControllerDelegate

  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    // The PHPickerViewController returns empty collection when canceled
    if results.isEmpty {
      handlePickingCancellation()
      picker.dismiss(animated: true)
      return
    }
    // The picker stays open until the selection has loaded; the handler dismisses it, and the
    // promise is settled only after the dismissal, so the app never presents over a closing picker.
    showLoadingOverlay(on: picker)
    handlePickedMedia(selection: results, picker: picker)
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

extension PHPickerViewController: PickerUIController {
  func setResultHandler(_ handler: ImagePickerHandler) {
    self.delegate = handler
    self.presentationController?.delegate = handler
  }
}
