// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit
import ExpoModulesCore

typealias MediaInfo = [UIImagePickerController.InfoKey : Any]

/**
 Helper struct storing single picking operation context variables that have their own non-sharable state.
 */
struct PickingContext {
  let promise: Promise
  let options: PickingOptions
  let imagePickerDelegate: ImagePickerDelegate
}

public class ImagePickerModule : Module, OnMediaPickingResultHandler {

  public func definition() -> ModuleDefinition {
    // TODO: (@bbarthec) change to "ExpoImagePicker" and propagate to other platforms
    name("ExponentImagePicker")

    onCreate {
      self.appContext?.permissions?.register([
        CameraPermissionRequester(),
        MediaLibraryPermissionRequester(),
        MediaLibraryWriteOnlyPermissionRequester()
      ]);
    }

    function("getCameraPermissionsAsync", { (promise: Promise) in
      self.appContext?.permissions?.getPermissionUsingRequesterClass(CameraPermissionRequester.self,
                                                                     resolve: promise.resolver,
                                                                     reject: promise.legacyRejecter)
    })

    function("getMediaLibraryPermissionsAsync", { (writeOnly: Bool, promise: Promise) in
      self.appContext?.permissions?.getPermissionUsingRequesterClass(self.getMediaLibraryPermissionRequester(writeOnly),
                                                                     resolve: promise.resolver,
                                                                     reject: promise.legacyRejecter)
    })

    function("requestCameraPermissionsAsync", { (promise: Promise) in
      self.appContext?.permissions?.askForPermission(usingRequesterClass: CameraPermissionRequester.self,
                                                     resolve: promise.resolver,
                                                     reject: promise.legacyRejecter)
    })

    function("requestMediaLibraryPermissionsAsync", { (writeOnly: Bool, promise: Promise) in
      self.appContext?.permissions?.askForPermission(usingRequesterClass: self.getMediaLibraryPermissionRequester(writeOnly),
                                                     resolve: promise.resolver,
                                                     reject: promise.legacyRejecter)
    })

    function("launchCameraAsync", self.launchCamera)
      .runOnQueue(.main)

    function("launchImageLibraryAsync", self.launchImageLibrary)
      .runOnQueue(.main)

  }

  private var currentPickingContext: PickingContext?

  private func getMediaLibraryPermissionRequester(_ writeOnly: Bool) -> AnyClass {
    if (writeOnly) {
      return MediaLibraryWriteOnlyPermissionRequester.self
    }
    return MediaLibraryPermissionRequester.self
  }

  private func launchCamera(options: PickingOptions, promise: Promise) {
    guard let permissions = self.appContext?.permissions else {
      return promise.reject(PermissionsModuleNotFoundError())
    }

    guard permissions.hasGrantedPermission(usingRequesterClass: CameraPermissionRequester.self) else {
      return promise.reject(MissingCameraPermissionError())
    }

    let pickingContext = PickingContext(promise: promise,
                                        options: options,
                                        imagePickerDelegate: ImagePickerDelegate(onMediaPickingResultHandler: self, hideStatusBarWhenPresented: options.allowsEditing))
    self.launchImagePicker(sourceType: .camera, pickingContext: pickingContext)
  }

  private func launchImageLibrary(options: PickingOptions, promise: Promise) {
    guard let _ = self.appContext?.permissions else { return promise.reject(PermissionsModuleNotFoundError()) }

    let pickingContext = PickingContext(promise: promise,
                                        options: options,
                                        imagePickerDelegate: ImagePickerDelegate(onMediaPickingResultHandler: self, hideStatusBarWhenPresented: options.allowsEditing))
    self.launchImagePicker(sourceType: .photoLibrary, pickingContext: pickingContext)
  }


  private func launchImagePicker(sourceType: UIImagePickerController.SourceType, pickingContext context: PickingContext) {
    let options = context.options
    let promise = context.promise
    let picker = UIImagePickerController()

    if (sourceType == .camera) {
#if targetEnvironment(simulator)
      return context.promise.reject(CameraUnavailableOnSimulatorError())
#else
      picker.sourceType = .camera
      picker.cameraDevice = context.options.cameraType == .front ? .front : .rear
#endif
    }

    if (sourceType == .photoLibrary) {
      picker.sourceType = .photoLibrary
    }

    picker.mediaTypes = options.mediaTypes.toArray()
    picker.videoExportPreset = options.videoExportPreset.toAVAssetExportPreset()
    picker.videoQuality = options.videoQuality.toQualityType()
    picker.videoMaximumDuration = options.videoMaxDuration

    if (options.allowsEditing) {
      picker.allowsEditing = options.allowsEditing
      if (options.videoMaxDuration > 600) {
        return promise.reject(MaxDurationWhileEditingExceededError())
      }
      if (options.videoMaxDuration == 0) {
        picker.videoMaximumDuration = 600.0
      }
    }

    picker.modalPresentationStyle = options.presentationStyle.toPresentationStyle()
    picker.delegate = context.imagePickerDelegate
    picker.presentationController?.delegate = context.imagePickerDelegate

    guard let currentViewController = self.appContext?.utilities?.currentViewController() else {
      return promise.reject(MissingCurrentViewController())
    }

    // Stora picking context as we're navigating to the different view controller (starting asynchrounus flow)
    self.currentPickingContext = context
    currentViewController.present(picker, animated: true, completion: nil)
  }

  // MARK: OnMediaPickingResultHandler

  func didCancelPicking() {
    self.currentPickingContext?.promise.resolve(["cancelled": true])
    self.currentPickingContext = nil
  }

  func didPickedMedia(mediaInfo: MediaInfo) {
    guard let options = self.currentPickingContext?.options,
          let promise = self.currentPickingContext?.promise else { self.appContext?.logger.warn("Picking operation context has been lost."); return }
    guard let fileSystem = self.appContext?.fileSystem else { return promise.reject(MissingFileSystemMmoduleError()) }
    guard let logger = self.appContext?.logger else { return promise.reject(MissingLoggerModuleError()) }

    // Clenaup the currently stored picking context
    self.currentPickingContext = nil

    let mediaHandler = MediaHandler(fileSystem: fileSystem,
                                    logger: logger,
                                    pickingOptions: options)
    mediaHandler.handleMedia(mediaInfo) { (result) in
      switch (result) {
      case .Failure(let error): return promise.reject(error)
      case .Success(let response): return promise.resolve(response.dictionary)
      }
    }
  }
}
