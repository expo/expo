// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit
import ExpoModulesCore

typealias MediaInfo = [UIImagePickerController.InfoKey: Any]

/**
 Helper struct storing single picking operation context variables that have their own non-sharable state.
 */
struct PickingContext {
  let promise: Promise
  let options: ImagePickerOptions
  let imagePickerHandler: ImagePickerHandler
}

enum OperationType {
  case ask
  case get
}

public class ImagePickerModule: Module, OnMediaPickingResultHandler {
  public func definition() -> ModuleDefinition {
    // TODO: (@bbarthec) change to "ExpoImagePicker" and propagate to other platforms
    name("ExponentImagePicker")

    onCreate {
      self.appContext?.permissions?.register([
        CameraPermissionRequester(),
        MediaLibraryPermissionRequester(),
        MediaLibraryWriteOnlyPermissionRequester()
      ])
    }

    function("getCameraPermissionsAsync", { (promise: Promise) in
      self.handlePermissionRequest(requesterClass: CameraPermissionRequester.self, operationType: .get, promise: promise)
    })

    function("getMediaLibraryPermissionsAsync", { (writeOnly: Bool, promise: Promise) in
      self.handlePermissionRequest(requesterClass: self.getMediaLibraryPermissionRequester(writeOnly), operationType: .get, promise: promise)
    })

    function("requestCameraPermissionsAsync", { (promise: Promise) in
      self.handlePermissionRequest(requesterClass: CameraPermissionRequester.self, operationType: .ask, promise: promise)
    })

    function("requestMediaLibraryPermissionsAsync", { (writeOnly: Bool, promise: Promise) in
      self.handlePermissionRequest(requesterClass: self.getMediaLibraryPermissionRequester(writeOnly), operationType: .ask, promise: promise)
    })

    function("launchCameraAsync", { (options: ImagePickerOptions, promise: Promise) -> Void in
      guard let permissions = self.appContext?.permissions else {
        return promise.reject(PermissionsModuleNotFoundException())
      }

      guard permissions.hasGrantedPermission(usingRequesterClass: CameraPermissionRequester.self) else {
        return promise.reject(MissingCameraPermissionException())
      }

      self.launchImagePicker(sourceType: .camera, options: options, promise: promise)
    }).runOnQueue(DispatchQueue.main)

    function("launchImageLibraryAsync", { (options: ImagePickerOptions, promise: Promise) in
      self.launchImagePicker(sourceType: .photoLibrary, options: options, promise: promise)
    }).runOnQueue(DispatchQueue.main)
  }

  private var currentPickingContext: PickingContext?

  private func handlePermissionRequest(requesterClass: AnyClass, operationType: OperationType, promise: Promise) {
    guard let permissions = self.appContext?.permissions else {
      return promise.reject(PermissionsModuleNotFoundException())
    }
    switch operationType {
    case .get: permissions.getPermissionUsingRequesterClass(requesterClass, resolve: promise.resolver, reject: promise.legacyRejecter)
    case .ask: permissions.askForPermission(usingRequesterClass: requesterClass, resolve: promise.resolver, reject: promise.legacyRejecter)
    }
  }

  private func getMediaLibraryPermissionRequester(_ writeOnly: Bool) -> AnyClass {
    return writeOnly ? MediaLibraryWriteOnlyPermissionRequester.self : MediaLibraryPermissionRequester.self
  }

  private func launchImagePicker(sourceType: UIImagePickerController.SourceType, options: ImagePickerOptions, promise: Promise) {
    guard let currentViewController = self.appContext?.utilities?.currentViewController() else {
      return promise.reject(MissingCurrentViewControllerException())
    }

    let imagePickerDelegate = ImagePickerHandler(onMediaPickingResultHandler: self, hideStatusBarWhenPresented: options.allowsEditing)
    let picker = UIImagePickerController()

    if sourceType == .camera {
#if targetEnvironment(simulator)
      return promise.reject(CameraUnavailableOnSimulatorException())
#else
      picker.sourceType = .camera
      picker.cameraDevice = options.cameraType == .front ? .front : .rear
#endif
    }

    if sourceType == .photoLibrary {
      picker.sourceType = .photoLibrary
    }

    picker.mediaTypes = options.mediaTypes.toArray()
    picker.videoExportPreset = options.videoExportPreset.toAVAssetExportPreset()
    picker.videoQuality = options.videoQuality.toQualityType()
    picker.videoMaximumDuration = options.videoMaxDuration
    picker.modalPresentationStyle = options.presentationStyle.toPresentationStyle()

    if options.allowsEditing {
      picker.allowsEditing = options.allowsEditing
      if options.videoMaxDuration > 600 {
        return promise.reject(MaxDurationWhileEditingExceededException())
      }
      if options.videoMaxDuration == 0 {
        picker.videoMaximumDuration = 600.0
      }
    }

    let pickingContext = PickingContext(promise: promise,
                                        options: options,
                                        imagePickerHandler: imagePickerDelegate)

    picker.delegate = pickingContext.imagePickerHandler
    picker.presentationController?.delegate = pickingContext.imagePickerHandler

    // Store picking context as we're navigating to the different view controller (starting asynchronous flow)
    self.currentPickingContext = pickingContext
    currentViewController.present(picker, animated: true, completion: nil)
  }

  // MARK: - OnMediaPickingResultHandler

  func didCancelPicking() {
    self.currentPickingContext?.promise.resolve(["cancelled": true])
    self.currentPickingContext = nil
  }

  func didPickMedia(mediaInfo: MediaInfo) {
    guard let options = self.currentPickingContext?.options,
          let promise = self.currentPickingContext?.promise else {
      NSLog("Picking operation context has been lost.")
      return
    }
    guard let fileSystem = self.appContext?.fileSystem else {
      return promise.reject(FileSystemModuleNotFoundException())
    }

    // Cleanup the currently stored picking context
    self.currentPickingContext = nil

    let mediaHandler = MediaHandler(fileSystem: fileSystem,
                                    options: options)
    mediaHandler.handleMedia(mediaInfo) { result -> Void in
      switch result {
      case .failure(let error): return promise.reject(error)
      case .success(let response): return promise.resolve(response.dictionary)
      }
    }
  }
}
