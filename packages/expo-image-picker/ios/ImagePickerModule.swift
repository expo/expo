// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit
import PhotosUI
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
    Name("ExponentImagePicker")

    OnCreate {
      self.appContext?.permissions?.register([
        CameraPermissionRequester(),
        MediaLibraryPermissionRequester(),
        MediaLibraryWriteOnlyPermissionRequester()
      ])
    }

    AsyncFunction("getCameraPermissionsAsync", { (promise: Promise) in
      self.handlePermissionRequest(requesterClass: CameraPermissionRequester.self, operationType: .get, promise: promise)
    })

    AsyncFunction("getMediaLibraryPermissionsAsync", { (writeOnly: Bool, promise: Promise) in
      self.handlePermissionRequest(requesterClass: self.getMediaLibraryPermissionRequester(writeOnly), operationType: .get, promise: promise)
    })

    AsyncFunction("requestCameraPermissionsAsync", { (promise: Promise) in
      self.handlePermissionRequest(requesterClass: CameraPermissionRequester.self, operationType: .ask, promise: promise)
    })

    AsyncFunction("requestMediaLibraryPermissionsAsync", { (writeOnly: Bool, promise: Promise) in
      self.handlePermissionRequest(requesterClass: self.getMediaLibraryPermissionRequester(writeOnly), operationType: .ask, promise: promise)
    })

    AsyncFunction("launchCameraAsync", { (options: ImagePickerOptions, promise: Promise) -> Void in
      guard let permissions = self.appContext?.permissions else {
        return promise.reject(PermissionsModuleNotFoundException())
      }

      guard permissions.hasGrantedPermission(usingRequesterClass: CameraPermissionRequester.self) else {
        return promise.reject(MissingCameraPermissionException())
      }

      self.launchImagePicker(sourceType: .camera, options: options, promise: promise)
    })
    .runOnQueue(DispatchQueue.main)

    AsyncFunction("launchImageLibraryAsync", { (options: ImagePickerOptions, promise: Promise) in
      self.launchImagePicker(sourceType: .photoLibrary, options: options, promise: promise)
    })
    .runOnQueue(DispatchQueue.main)
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
    let imagePickerDelegate = ImagePickerHandler(onMediaPickingResultHandler: self, hideStatusBarWhenPresented: options.allowsEditing && !options.allowsMultipleSelection)

    let pickingContext = PickingContext(promise: promise,
                                        options: options,
                                        imagePickerHandler: imagePickerDelegate)

    if !options.allowsEditing && sourceType != .camera {
      self.launchMultiSelectPicker(pickingContext: pickingContext)
    } else {
      self.launchLegacyImagePicker(sourceType: sourceType, pickingContext: pickingContext)
    }
  }

  private func launchLegacyImagePicker(sourceType: UIImagePickerController.SourceType, pickingContext: PickingContext) {
    let options = pickingContext.options

    let picker = UIImagePickerController()
    picker.fixCannotMoveEditingBox()

    if sourceType == .camera {
#if targetEnvironment(simulator)
      return pickingContext.promise.reject(CameraUnavailableOnSimulatorException())
#else
      picker.sourceType = .camera
      picker.cameraDevice = options.cameraType == .front ? .front : .rear
#endif
    }

    if sourceType == .photoLibrary {
      picker.sourceType = .photoLibrary
    }

    picker.mediaTypes = options.toMediaTypesArray()

    if options.requiresMicrophonePermission() && sourceType == .camera {
      do {
        try checkMicrophonePermissions()
      } catch {
        pickingContext.promise.reject(error)
        return
      }
    }

    picker.videoExportPreset = options.videoExportPreset.toAVAssetExportPreset()
    picker.videoQuality = options.videoQuality.toQualityType()
    picker.videoMaximumDuration = options.videoMaxDuration

    if options.allowsEditing {
      picker.allowsEditing = options.allowsEditing
      if options.videoMaxDuration > 600 {
        return pickingContext.promise.reject(MaxDurationWhileEditingExceededException())
      }
      if options.videoMaxDuration == 0 {
        picker.videoMaximumDuration = 600.0
      }
    }

    presentPickerUI(picker, pickingContext: pickingContext)
  }

  private func checkMicrophonePermissions() throws {
    guard Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") != nil else {
      throw MissingMicrophonePermissionException()
    }
  }

  private func launchMultiSelectPicker(pickingContext: PickingContext) {
    var configuration = PHPickerConfiguration(photoLibrary: PHPhotoLibrary.shared())
    let options = pickingContext.options

    // selection limit = 1 --> single selection, reflects the old picker behavior
    configuration.selectionLimit = options.allowsMultipleSelection ? options.selectionLimit : SINGLE_SELECTION
    configuration.filter = options.toPickerFilter()
    configuration.preferredAssetRepresentationMode = options.preferredAssetRepresentationMode.toAssetRepresentationMode()
    configuration.selection = options.orderedSelection ? .ordered : .default

    let picker = PHPickerViewController(configuration: configuration)

    presentPickerUI(picker, pickingContext: pickingContext)
  }

  private func presentPickerUI(_ picker: PickerUIController, pickingContext context: PickingContext) {
    guard let currentViewController = self.appContext?.utilities?.currentViewController() else {
      return context.promise.reject(MissingCurrentViewControllerException())
    }

    picker.modalPresentationStyle = context.options.presentationStyle.toPresentationStyle()

    if UIDevice.current.userInterfaceIdiom == .pad {
      let viewFrame = currentViewController.view.frame
      picker.popoverPresentationController?.sourceRect = CGRect(
        x: viewFrame.midX,
        y: viewFrame.maxY,
        width: 0,
        height: 0
      )
      picker.popoverPresentationController?.sourceView = currentViewController.view
    }

    picker.setResultHandler(context.imagePickerHandler)

    // Store picking context as we're navigating to the different view controller (starting asynchronous flow)
    self.currentPickingContext = context
    currentViewController.present(picker, animated: true, completion: nil)
  }

  // MARK: - OnMediaPickingResultHandler

  func didCancelPicking() {
    self.currentPickingContext?.promise.resolve(ImagePickerResponse(assets: nil, canceled: true))
    self.currentPickingContext = nil
  }

  func didPickMultipleMedia(selection: [PHPickerResult]) {
    guard let options = self.currentPickingContext?.options,
          let promise = self.currentPickingContext?.promise else {
      log.error("Picking operation context has been lost.")
      return
    }
    guard let fileSystem = self.appContext?.fileSystem else {
      return promise.reject(FileSystemModuleNotFoundException())
    }

    let mediaHandler = MediaHandler(fileSystem: fileSystem,
                                    options: options)

    // Clean up the currently stored picking context
    self.currentPickingContext = nil

    Task {
      do {
        let assets = try await mediaHandler.handleMultipleMedia(selection)
        promise.resolve(ImagePickerResponse(assets: assets, canceled: false))
      } catch {
        promise.reject(error)
      }
    }
  }

  func didPickMedia(mediaInfo: MediaInfo) {
    guard let options = self.currentPickingContext?.options,
          let promise = self.currentPickingContext?.promise else {
      log.error("Picking operation context has been lost.")
      return
    }
    guard let fileSystem = self.appContext?.fileSystem else {
      return promise.reject(FileSystemModuleNotFoundException())
    }

    // Clean up the currently stored picking context
    self.currentPickingContext = nil

    let mediaHandler = MediaHandler(fileSystem: fileSystem,
                                    options: options)
    Task {
      do {
        let asset = try await mediaHandler.handleMedia(mediaInfo)
        promise.resolve(ImagePickerResponse(assets: [asset], canceled: false))
      } catch {
        promise.reject(error)
      }
    }
  }
}
