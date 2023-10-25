// Copyright 2022-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

public final class CameraViewNextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCameraNext")

    OnCreate {
      let permissionsManager = self.appContext?.permissions

      EXPermissionsMethodsDelegate.register(
        [
          CameraPermissionRequester(),
          CameraOnlyPermissionRequester(),
          CameraMicrophonePermissionRequester()
        ],
        withPermissionsManager: permissionsManager
      )
    }

    Constants([
      "Type": [
        "front": CameraTypeNext.front.rawValue,
        "back": CameraTypeNext.back.rawValue
      ],
      "FlashMode": [
        "off": CameraFlashModeNext.off.rawValue,
        "on": CameraFlashModeNext.on.rawValue,
        "auto": CameraFlashModeNext.auto.rawValue
      ],
      "VideoQuality": [
        "2160p": VideoQualityNext.video2160p.rawValue,
        "1080p": VideoQualityNext.video1080p.rawValue,
        "720p": VideoQualityNext.video720p.rawValue,
        "480p": VideoQualityNext.video4x3.rawValue,
        "4:3": VideoQualityNext.video4x3.rawValue
      ]
    ])

    // swiftlint:disable:next closure_body_length
    View(CameraViewNext.self) {
      Events(
        "onCameraReady",
        "onMountError",
        "onPictureSaved",
        "onBarCodeScanned",
        "onResponsiveOrientationChanged"
      )

      Prop("type") { (view, type: CameraType) in
        if view.presetCamera.rawValue != type.rawValue {
          view.presetCamera = type.toPosition()
        }
      }

      Prop("flashMode") { (view, flashMode: CameraFlashModeNext) in
        if view.flashMode.rawValue != flashMode.rawValue {
          view.flashMode = flashMode
        }
      }

      Prop("barCodeScannerSettings") { (view, settings: [String: Any]) in
        view.setBarCodeScannerSettings(settings: settings)
      }

      Prop("zoom") { (view, zoom: Double) in
        if fabs(view.zoom - zoom) > Double.ulpOfOne {
          view.zoom = zoom
        }
      }

      Prop("barCodeScannerEnabled") { (view, scanBarCodes: Bool?) in
        if view.isScanningBarCodes != scanBarCodes {
          view.isScanningBarCodes = scanBarCodes ?? false
        }
      }
      
      Prop("enableTorch") { (view, enabled: Bool) in
        view.torchEnabled = enabled
      }
      
      Prop("mode") { (view, mode: CameraModeNext) in
        view.mode = mode
      }

      Prop("responsiveOrientationWhenOrientationLocked") { (view, responsiveOrientation: Bool) in
        if view.responsiveWhenOrientationLocked != responsiveOrientation {
          view.responsiveWhenOrientationLocked = responsiveOrientation
        }
      }
    }

    AsyncFunction("takePicture") { (options: TakePictureOptionsNext, viewTag: Int, promise: Promise) in
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewNext.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewNext.self))
      }
      #if targetEnvironment(simulator)
      try takePictureForSimulator(self.appContext, view, options, promise)
      #else // simulator
      view.takePicture(options: options, promise: promise)
      #endif // not simulator
    }
    .runOnQueue(.main)

    AsyncFunction("record") { (options: CameraRecordingOptionsNext, viewTag: Int, promise: Promise) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewNext.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewNext.self))
      }
      view.record(options: options, promise: promise)
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("stopRecording") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewNext.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewNext.self))
      }
      view.stopRecording()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: CameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: CameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getCameraPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: CameraOnlyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestCameraPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: CameraOnlyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getMicrophonePermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: CameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestMicrophonePermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: CameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}

private func takePictureForSimulator(
  _ appContext: AppContext?,
  _ view: CameraView,
  _ options: TakePictureOptions,
  _ promise: Promise
) throws {
  if options.fastMode {
    promise.resolve()
  }
  let result = try generatePictureForSimulator(appContext: appContext, options: options)

  if options.fastMode {
    view.onPictureSaved([
      "data": result,
      "id": options.id
    ])
  } else {
    promise.resolve(result)
  }
}

private func generatePictureForSimulator(
  appContext: AppContext?,
  options: TakePictureOptions
) throws -> [String: Any?] {
  guard let fileSystem = appContext?.fileSystem else {
    throw Exceptions.FileSystemModuleNotFound()
  }
  let path = fileSystem.generatePath(
    inDirectory: fileSystem.cachesDirectory.appending("/Camera"),
    withExtension: ".jpg"
  )
  let generatedPhoto = ExpoCameraUtilsNext.generatePhoto(of: CGSize(width: 200, height: 200))
  guard let photoData = generatedPhoto.jpegData(compressionQuality: options.quality) else {
    throw CameraInvalidPhotoData()
  }

  return [
    "uri": ExpoCameraUtils.write(data: photoData, to: path),
    "width": generatedPhoto.size.width,
    "height": generatedPhoto.size.height,
    "base64": options.base64 ? photoData.base64EncodedString() : nil
  ]
}

private let pictureSizesDict = [
  "3840x2160": AVCaptureSession.Preset.hd4K3840x2160,
  "1920x1080": AVCaptureSession.Preset.hd1920x1080,
  "1280x720": AVCaptureSession.Preset.hd1280x720,
  "640x480": AVCaptureSession.Preset.vga640x480,
  "352x288": AVCaptureSession.Preset.cif352x288,
  "Photo": AVCaptureSession.Preset.photo,
  "High": AVCaptureSession.Preset.high,
  "Medium": AVCaptureSession.Preset.medium,
  "Low": AVCaptureSession.Preset.low
]
