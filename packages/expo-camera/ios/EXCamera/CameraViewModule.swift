// Copyright 2022-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

public final class CameraViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExponentCamera")

    OnCreate {
      let permissionsManager = self.appContext?.permissions

      EXPermissionsMethodsDelegate.register(
        [EXCameraPermissionRequester(), EXCameraCameraPermissionRequester(), EXCameraMicrophonePermissionRequester()],
        withPermissionsManager: permissionsManager
      )
    }

    Constants([
      "Type": [
        "front": EXCameraType.front,
        "back": EXCameraType.back
      ],
      "FlashMode": [
        "off": EXCameraFlashMode.off,
        "on": EXCameraFlashMode.on,
        "auto": EXCameraFlashMode.auto,
        "torch": EXCameraFlashMode.torch
      ],
      "AutoFocus": [
        "on": EXCameraAutoFocus.on,
        "off": EXCameraAutoFocus.off
      ],
      "WhiteBalance": [
        "auto": EXCameraWhiteBalance.auto,
        "sunny": EXCameraWhiteBalance.sunny,
        "cloudy": EXCameraWhiteBalance.cloudy,
        "shadow": EXCameraWhiteBalance.shadow,
        "incandescent": EXCameraWhiteBalance.incandescent,
        "fluorescent": EXCameraWhiteBalance.fluorescent
      ],
      "VideoQuality": [
        "2160p": EXCameraVideoResolution.video2160p,
        "1080p": EXCameraVideoResolution.video1080p,
        "720p": EXCameraVideoResolution.video720p,
        "480p": EXCameraVideoResolution.video4x3,
        "4:3": EXCameraVideoResolution.video4x3
      ],
      "VideoStabilization": [
        "off": EXCameraVideoStabilizationMode.videoStabilizationModeOff,
        "standard": EXCameraVideoStabilizationMode.videoStabilizationModeStandard,
        "cinematic": EXCameraVideoStabilizationMode.videoStabilizationModeCinematic,
        "auto": EXCameraVideoStabilizationMode.avCaptureVideoStabilizationModeAuto
      ],
      "VideoCodec": [
        "H264": EXCameraVideoCodec.H264,
        "HEVC": EXCameraVideoCodec.HEVC,
        "JPEG": EXCameraVideoCodec.JPEG,
        "AppleProRes422": EXCameraVideoCodec.appleProRes422,
        "AppleProRes4444": EXCameraVideoCodec.appleProRes4444
      ]
    ])

    ViewManager {
      // TODO: For some unknown reason, the below line doesn't compile when used within the `View` component.
      // That's probably fine as a workaround, since we plan to get rid of custom view factories anyway.
      let legacyModuleRegistry = self.appContext?.legacyModuleRegistry

      View {
        return EXCamera(moduleRegistry: legacyModuleRegistry)
      }

      Events(
        "onCameraReady",
        "onMountError",
        "onPictureSaved",
        "onBarCodeScanned",
        "onFacesDetected"
      )

      Prop("type") { (view: EXCamera, type: Int) in
        if view.presetCamera != type {
          view.presetCamera = type
          view.updateType()
        }
      }

      Prop("flashMode") { (view: EXCamera, flashMode: Int) in
        if let flashMode = EXCameraFlashMode(rawValue: flashMode), view.flashMode != flashMode {
          view.flashMode = flashMode
          view.updateFlashMode()
        }
      }

      Prop("faceDetectorSettings") { (view: EXCamera, settings: [String: Any]) in
        view.updateFaceDetectorSettings(settings)
      }

      Prop("barCodeScannerSettings") { (view: EXCamera, settings: [String: Any]) in
        view.setBarCodeScannerSettings(settings)
      }

      Prop("autoFocus") { (view: EXCamera, autoFocus: Int) in
        if view.autoFocus != autoFocus {
          view.autoFocus = autoFocus
          view.updateFocusMode()
        }
      }

      Prop("focusDepth") { (view: EXCamera, focusDepth: Float) in
        if fabsf(view.focusDepth - focusDepth) > Float.ulpOfOne {
          view.focusDepth = focusDepth
          view.updateFocusDepth()
        }
      }

      Prop("zoom") { (view: EXCamera, zoom: Double) in
        if fabs(view.zoom - zoom) > Double.ulpOfOne {
          view.zoom = zoom
          view.updateZoom()
        }
      }

      Prop("whiteBalance") { (view: EXCamera, whiteBalance: Int) in
        if view.whiteBalance != whiteBalance {
          view.whiteBalance = whiteBalance
          view.updateWhiteBalance()
        }
      }

      Prop("pictureSize") { (view: EXCamera, pictureSize: String) in
        view.pictureSize = pictureSizesDict[pictureSize]?.rawValue as NSString?
        view.updatePictureSize()
      }

      Prop("faceDetectorEnabled") { (view: EXCamera, detectFaces: Bool) in
        if view.isDetectingFaces != detectFaces {
          view.isDetectingFaces = detectFaces
        }
      }

      Prop("barCodeScannerEnabled") { (view: EXCamera, scanBarCodes: Bool) in
        if view.isScanningBarCodes != scanBarCodes {
          view.isScanningBarCodes = scanBarCodes
        }
      }
    }

    AsyncFunction("takePicture") { (options: TakePictureOptions, viewTag: Int, promise: Promise) in
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: EXCamera.self))
      }
      #if targetEnvironment(simulator)
      try takePictureForSimulator(self.appContext, view, options, promise)
      #else // simulator
      view.takePicture(options.toDictionary(), resolve: promise.resolver, reject: promise.legacyRejecter)
      #endif // not simulator
    }
    .runOnQueue(.main)

    AsyncFunction("record") { (options: [String: Any], viewTag: Int, promise: Promise) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #endif
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: EXCamera.self))
      }
      view.record(options, resolve: promise.resolver, reject: promise.legacyRejecter)
    }
    .runOnQueue(.main)

    AsyncFunction("stopRecording") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #endif
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: EXCamera.self))
      }
      view.stopRecording()
    }
    .runOnQueue(.main)

    AsyncFunction("resumePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #endif
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: EXCamera.self))
      }
      view.resumePreview()
    }
    .runOnQueue(.main)

    AsyncFunction("pausePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #endif
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: EXCamera.self))
      }
      view.pausePreview()
    }
    .runOnQueue(.main)

    AsyncFunction("getAvailablePictureSizes") { (_: String?, _: Int) in
      // Argument types must be compatible with Android which receives the ratio and view tag.
      return pictureSizesDict.keys
    }

    AsyncFunction("getAvailableVideoCodecsAsync") { () -> [String] in
      return getAvailableVideoCodecs()
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: EXCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: EXCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getCameraPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: EXCameraCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestCameraPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: EXCameraCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getMicrophonePermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: EXCameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestMicrophonePermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: EXCameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}

private func takePictureForSimulator(_ appContext: AppContext?, _ view: EXCamera, _ options: TakePictureOptions, _ promise: Promise) throws {
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

private func generatePictureForSimulator(appContext: AppContext?, options: TakePictureOptions) throws -> [String: Any?] {
  guard let fs = appContext?.fileSystem else {
    throw Exceptions.FileSystemModuleNotFound()
  }
  let path = fs.generatePath(inDirectory: fs.cachesDirectory.appending("Camera"), withExtension: ".jpg")
  let generatedPhoto = EXCameraUtils.generatePhoto(of: CGSize(width: 200, height: 200))
  let photoData = generatedPhoto.jpegData(compressionQuality: options.quality)

  return [
    "uri": EXCameraUtils.writeImage(photoData, toPath: path),
    "width": generatedPhoto.size.width,
    "height": generatedPhoto.size.height,
    "base64": options.base64 ? photoData?.base64EncodedString() : nil
  ]
}

private func getAvailableVideoCodecs() -> [String] {
  let session = AVCaptureSession()

  session.beginConfiguration()

  guard let captureDevice = EXCameraUtils.device(withMediaType: AVMediaType.video.rawValue, preferring: AVCaptureDevice.Position.front) else {
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
