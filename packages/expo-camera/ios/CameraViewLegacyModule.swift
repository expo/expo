// Copyright 2022-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

let cameraLegacyEvents = ["onCameraReady", "onMountError", "onPictureSaved", "onBarCodeScanned", "onFacesDetected", "onResponsiveOrientationChanged"]

public final class CameraViewLegacyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCameraLegacy")

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
        "front": CameraTypeLegacy.front.rawValue,
        "back": CameraTypeLegacy.back.rawValue
      ],
      "FlashMode": [
        "off": FlashModeLegacy.off.rawValue,
        "on": FlashModeLegacy.on.rawValue,
        "auto": FlashModeLegacy.auto.rawValue,
        "torch": FlashModeLegacy.torch.rawValue
      ],
      "AutoFocus": [
        "on": AutoFocus.on.rawValue,
        "off": AutoFocus.off.rawValue
      ],
      "WhiteBalance": [
        "auto": WhiteBalance.auto.rawValue,
        "sunny": WhiteBalance.sunny.rawValue,
        "cloudy": WhiteBalance.cloudy.rawValue,
        "shadow": WhiteBalance.shadow.rawValue,
        "incandescent": WhiteBalance.incandescent.rawValue,
        "fluorescent": WhiteBalance.fluorescent.rawValue
      ],
      "VideoQuality": [
        "2160p": VideoQuality.video2160p.rawValue,
        "1080p": VideoQuality.video1080p.rawValue,
        "720p": VideoQuality.video720p.rawValue,
        "480p": VideoQuality.video4x3.rawValue,
        "4:3": VideoQuality.video4x3.rawValue
      ],
      "VideoStabilization": [
        "off": VideoStabilizationMode.off.rawValue,
        "standard": VideoStabilizationMode.standard.rawValue,
        "cinematic": VideoStabilizationMode.cinematic.rawValue,
        "auto": VideoStabilizationMode.auto.rawValue
      ],
      "VideoCodec": [
        "H264": VideoCodecLegacy.h264.rawValue,
        "HEVC": VideoCodecLegacy.hevc.rawValue,
        "JPEG": VideoCodecLegacy.jpeg.rawValue,
        "AppleProRes422": VideoCodecLegacy.appleProRes422.rawValue,
        "AppleProRes4444": VideoCodecLegacy.appleProRes4444.rawValue
      ]
    ])

    // swiftlint:disable:next closure_body_length
    View(CameraViewLegacy.self) {
      Events(cameraLegacyEvents)

      Prop("type") { (view, type: CameraTypeLegacy) in
        if view.presetCamera.rawValue != type.rawValue {
          view.presetCamera = type.toPosition()
        }
      }

      Prop("flashMode") { (view, flashMode: FlashModeLegacy) in
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

      Prop("autoFocus") { (view, autoFocus: AutoFocus) in
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

      Prop("whiteBalance") { (view, whiteBalance: WhiteBalance) in
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
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewLegacy.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraView.self))
      }
      #if targetEnvironment(simulator)
      try takePictureForSimulator(self.appContext, view, options, promise)
      #else // simulator
      view.takePicture(options: options, promise: promise)
      #endif // not simulator
    }
    .runOnQueue(.main)

    AsyncFunction("record") { (options: CameraRecordingOptionsLegacy, viewTag: Int, promise: Promise) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewLegacy.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewLegacy.self))
      }
      view.record(options: options, promise: promise)
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("stopRecording") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewLegacy.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewLegacy.self))
      }
      view.stopRecording()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("resumePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewLegacy.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewLegacy.self))
      }
      view.resumePreview()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("pausePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: CameraViewLegacy.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: CameraViewLegacy.self))
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
