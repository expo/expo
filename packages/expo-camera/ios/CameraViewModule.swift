// Copyright 2022-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

let cameraEvents = ["onCameraReady", "onMountError", "onPictureSaved", "onBarCodeScanned", "onFacesDetected", "onResponsiveOrientationChanged"]

public final class CameraViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCamera")

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
        "front": CameraType.front.rawValue,
        "back": CameraType.back.rawValue
      ],
      "FlashMode": [
        "off": CameraFlashMode.off.rawValue,
        "on": CameraFlashMode.on.rawValue,
        "auto": CameraFlashMode.auto.rawValue,
        "torch": CameraFlashMode.torch.rawValue
      ],
      "AutoFocus": [
        "on": CameraAutoFocus.on.rawValue,
        "off": CameraAutoFocus.off.rawValue
      ],
      "WhiteBalance": [
        "auto": CameraWhiteBalance.auto.rawValue,
        "sunny": CameraWhiteBalance.sunny.rawValue,
        "cloudy": CameraWhiteBalance.cloudy.rawValue,
        "shadow": CameraWhiteBalance.shadow.rawValue,
        "incandescent": CameraWhiteBalance.incandescent.rawValue,
        "fluorescent": CameraWhiteBalance.fluorescent.rawValue
      ],
      "VideoQuality": [
        "2160p": VideoQuality.video2160p.rawValue,
        "1080p": VideoQuality.video1080p.rawValue,
        "720p": VideoQuality.video720p.rawValue,
        "480p": VideoQuality.video4x3.rawValue,
        "4:3": VideoQuality.video4x3.rawValue
      ],
      "VideoStabilization": [
        "off": CameraVideoStabilizationMode.off.rawValue,
        "standard": CameraVideoStabilizationMode.standard.rawValue,
        "cinematic": CameraVideoStabilizationMode.cinematic.rawValue,
        "auto": CameraVideoStabilizationMode.auto.rawValue
      ],
      "VideoCodec": [
        "H264": CameraVideoCodec.h264.rawValue,
        "HEVC": CameraVideoCodec.hevc.rawValue,
        "JPEG": CameraVideoCodec.jpeg.rawValue,
        "AppleProRes422": CameraVideoCodec.appleProRes422.rawValue,
        "AppleProRes4444": CameraVideoCodec.appleProRes4444.rawValue
      ]
    ])

    View(CameraView.self) {
      Events(cameraEvents)

      Prop("type") { (view, type: CameraType) in
        if view.presetCamera.rawValue != type.rawValue {
          view.presetCamera = type.toPosition()
        }
      }

      Prop("flashMode") { (view, flashMode: CameraFlashMode) in
        if view.flashMode.rawValue != flashMode.rawValue {
          view.flashMode = flashMode
        }
      }

      Prop("faceDetectorSettings") { (view, settings: [String: Any]) in
        view.updateFaceDetectorSettings(settings: settings)
      }

      Prop("barCodeScannerSettings") { (view, settings: [String: Any]) in
        view.setBarCodeScannerSettings(settings: settings)
      }

      Prop("autoFocus") { (view, autoFocus: CameraAutoFocus) in
        if view.autoFocus.rawValue != autoFocus.rawValue {
          view.autoFocus = autoFocus.toAvAutoFocus()
        }
      }

      Prop("focusDepth") { (view, focusDepth: Float) in
        if fabsf(view.focusDepth - focusDepth) > Float.ulpOfOne {
          view.focusDepth = focusDepth
        }
      }

      Prop("zoom") { (view, zoom: Double) in
        if fabs(view.zoom - zoom) > Double.ulpOfOne {
          view.zoom = zoom
        }
      }

      Prop("whiteBalance") { (view, whiteBalance: CameraWhiteBalance) in
        if view.whiteBalance.rawValue != whiteBalance.rawValue {
          view.whiteBalance = whiteBalance
        }
      }

      Prop("pictureSize") { (view, pictureSize: String) in
        if let size = pictureSizesDict[pictureSize] {
          view.pictureSize = size
        }
      }

      Prop("faceDetectorEnabled") { (view, detectFaces: Bool?) in
        if view.isDetectingFaces != detectFaces {
          view.isDetectingFaces = detectFaces ?? false
        }
      }

      Prop("barCodeScannerEnabled") { (view, scanBarCodes: Bool?) in
        if view.isScanningBarCodes != scanBarCodes {
          view.isScanningBarCodes = scanBarCodes ?? false
        }
      }

      Prop("responsiveOrientationWhenOrientationLocked") { (view, responsiveOrientation: Bool) in
        if view.responsiveWhenOrientationLocked != responsiveOrientation {
          view.responsiveWhenOrientationLocked = responsiveOrientation
        }
      }
    }

    AsyncFunction("takePicture") { (options: TakePictureOptions, viewTag: Int, promise: Promise) in
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraView.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraView.self))
      }
      #if targetEnvironment(simulator)
      try takePictureForSimulator(self.appContext, view, options, promise)
      #else // simulator
      view.takePicture(options: options, promise: promise)
      #endif // not simulator
    }
    .runOnQueue(.main)

    AsyncFunction("record") { (options: CameraRecordingOptions, viewTag: Int, promise: Promise) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraView.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraView.self))
      }
      view.record(options: options, promise: promise)
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("stopRecording") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraView.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraView.self))
      }
      view.stopRecording()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("resumePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraView.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraView.self))
      }
      view.resumePreview()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("pausePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraView.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraView.self))
      }
      view.pausePreview()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("getAvailablePictureSizes") { (_: String?, _: Int) in
      // Argument types must be compatible with Android which receives the ratio and view tag.
      return pictureSizesDict.map { k, _ in
        k
      }
    }

    AsyncFunction("getAvailableVideoCodecsAsync") { () -> [String] in
      return getAvailableVideoCodecs()
    }

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
  let path = FileSystemUtilities.generatePathInCache(
    appContext,
    in: "Camera",
    extension: ".jpg"
  )
  let generatedPhoto = ExpoCameraUtils.generatePhoto(of: CGSize(width: 200, height: 200))
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

private func getAvailableVideoCodecs() -> [String] {
  let session = AVCaptureSession()

  session.beginConfiguration()

  guard let captureDevice = ExpoCameraUtils.device(
    with: AVMediaType.video,
    preferring: AVCaptureDevice.Position.front) else {
    return []
  }
  guard let deviceInput = try? AVCaptureDeviceInput(device: captureDevice) else {
    return []
  }
  if session.canAddInput(deviceInput) {
    session.addInput(deviceInput)
  }

  session.commitConfiguration()

  let movieFileOutput = AVCaptureMovieFileOutput()

  if session.canAddOutput(movieFileOutput) {
    session.addOutput(movieFileOutput)
  }
  return movieFileOutput.availableVideoCodecTypes.map { $0.rawValue }
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
