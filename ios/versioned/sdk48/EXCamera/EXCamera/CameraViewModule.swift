// Copyright 2022-present 650 Industries. All rights reserved.

import AVFoundation
import ABI48_0_0ExpoModulesCore

public final class CameraViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExponentCamera")

    OnCreate {
      let permissionsManager = self.appContext?.permissions

      ABI48_0_0EXPermissionsMethodsDelegate.register(
        [ABI48_0_0EXCameraPermissionRequester(), ABI48_0_0EXCameraCameraPermissionRequester(), ABI48_0_0EXCameraMicrophonePermissionRequester()],
        withPermissionsManager: permissionsManager
      )
    }

    Constants([
      "Type": [
        "front": ABI48_0_0EXCameraType.front.rawValue,
        "back": ABI48_0_0EXCameraType.back.rawValue
      ],
      "FlashMode": [
        "off": ABI48_0_0EXCameraFlashMode.off.rawValue,
        "on": ABI48_0_0EXCameraFlashMode.on.rawValue,
        "auto": ABI48_0_0EXCameraFlashMode.auto.rawValue,
        "torch": ABI48_0_0EXCameraFlashMode.torch.rawValue
      ],
      "AutoFocus": [
        "on": ABI48_0_0EXCameraAutoFocus.on.rawValue,
        "off": ABI48_0_0EXCameraAutoFocus.off.rawValue
      ],
      "WhiteBalance": [
        "auto": ABI48_0_0EXCameraWhiteBalance.auto.rawValue,
        "sunny": ABI48_0_0EXCameraWhiteBalance.sunny.rawValue,
        "cloudy": ABI48_0_0EXCameraWhiteBalance.cloudy.rawValue,
        "shadow": ABI48_0_0EXCameraWhiteBalance.shadow.rawValue,
        "incandescent": ABI48_0_0EXCameraWhiteBalance.incandescent.rawValue,
        "fluorescent": ABI48_0_0EXCameraWhiteBalance.fluorescent.rawValue
      ],
      "VideoQuality": [
        "2160p": ABI48_0_0EXCameraVideoResolution.video2160p.rawValue,
        "1080p": ABI48_0_0EXCameraVideoResolution.video1080p.rawValue,
        "720p": ABI48_0_0EXCameraVideoResolution.video720p.rawValue,
        "480p": ABI48_0_0EXCameraVideoResolution.video4x3.rawValue,
        "4:3": ABI48_0_0EXCameraVideoResolution.video4x3.rawValue
      ],
      "VideoStabilization": [
        "off": ABI48_0_0EXCameraVideoStabilizationMode.videoStabilizationModeOff.rawValue,
        "standard": ABI48_0_0EXCameraVideoStabilizationMode.videoStabilizationModeStandard.rawValue,
        "cinematic": ABI48_0_0EXCameraVideoStabilizationMode.videoStabilizationModeCinematic.rawValue,
        "auto": ABI48_0_0EXCameraVideoStabilizationMode.avCaptureVideoStabilizationModeAuto.rawValue
      ],
      "VideoCodec": [
        "H264": ABI48_0_0EXCameraVideoCodec.H264.rawValue,
        "HEVC": ABI48_0_0EXCameraVideoCodec.HEVC.rawValue,
        "JPEG": ABI48_0_0EXCameraVideoCodec.JPEG.rawValue,
        "AppleProRes422": ABI48_0_0EXCameraVideoCodec.appleProRes422.rawValue,
        "AppleProRes4444": ABI48_0_0EXCameraVideoCodec.appleProRes4444.rawValue
      ]
    ])

    View(ABI48_0_0EXCamera.self) {
      Events(
        "onCameraReady",
        "onMountError",
        "onPictureSaved",
        "onBarCodeScanned",
        "onFacesDetected"
      )

      Prop("type") { (view, type: Int) in
        if view.presetCamera != type {
          view.presetCamera = type
          view.updateType()
        }
      }

      Prop("flashMode") { (view, flashMode: Int) in
        if let flashMode = ABI48_0_0EXCameraFlashMode(rawValue: flashMode), view.flashMode != flashMode {
          view.flashMode = flashMode
          view.updateFlashMode()
        }
      }

      Prop("faceDetectorSettings") { (view, settings: [String: Any]) in
        view.updateFaceDetectorSettings(settings)
      }

      Prop("barCodeScannerSettings") { (view, settings: [String: Any]) in
        view.setBarCodeScannerSettings(settings)
      }

      Prop("autoFocus") { (view, autoFocus: Int) in
        if view.autoFocus != autoFocus {
          view.autoFocus = autoFocus
          view.updateFocusMode()
        }
      }

      Prop("focusDepth") { (view, focusDepth: Float) in
        if fabsf(view.focusDepth - focusDepth) > Float.ulpOfOne {
          view.focusDepth = focusDepth
          view.updateFocusDepth()
        }
      }

      Prop("zoom") { (view, zoom: Double) in
        if fabs(view.zoom - zoom) > Double.ulpOfOne {
          view.zoom = zoom
          view.updateZoom()
        }
      }

      Prop("whiteBalance") { (view, whiteBalance: Int) in
        if view.whiteBalance != whiteBalance {
          view.whiteBalance = whiteBalance
          view.updateWhiteBalance()
        }
      }

      Prop("pictureSize") { (view, pictureSize: String) in
        view.pictureSize = pictureSizesDict[pictureSize]?.rawValue as NSString?
        view.updatePictureSize()
      }

      Prop("faceDetectorEnabled") { (view, detectFaces: Bool) in
        if view.isDetectingFaces != detectFaces {
          view.isDetectingFaces = detectFaces
        }
      }

      Prop("barCodeScannerEnabled") { (view, scanBarCodes: Bool) in
        if view.isScanningBarCodes != scanBarCodes {
          view.isScanningBarCodes = scanBarCodes
        }
      }
    }

    AsyncFunction("takePicture") { (options: TakePictureOptions, viewTag: Int, promise: Promise) in
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: ABI48_0_0EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: ABI48_0_0EXCamera.self))
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
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: ABI48_0_0EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: ABI48_0_0EXCamera.self))
      }
      view.record(options, resolve: promise.resolver, reject: promise.legacyRejecter)
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("stopRecording") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: ABI48_0_0EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: ABI48_0_0EXCamera.self))
      }
      view.stopRecording()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("resumePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: ABI48_0_0EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: ABI48_0_0EXCamera.self))
      }
      view.resumePreview()
      #endif
    }
    .runOnQueue(.main)

    AsyncFunction("pausePreview") { (viewTag: Int) in
      #if targetEnvironment(simulator)
      throw Exceptions.SimulatorNotSupported()
      #else
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: ABI48_0_0EXCamera.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: ABI48_0_0EXCamera.self))
      }
      view.pausePreview()
      #endif
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
      ABI48_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: ABI48_0_0EXCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: ABI48_0_0EXCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getCameraPermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: ABI48_0_0EXCameraCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestCameraPermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: ABI48_0_0EXCameraCameraPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getMicrophonePermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: ABI48_0_0EXCameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestMicrophonePermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: ABI48_0_0EXCameraMicrophonePermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}

private func takePictureForSimulator(_ appContext: AppContext?, _ view: ABI48_0_0EXCamera, _ options: TakePictureOptions, _ promise: Promise) throws {
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
  let path = fs.generatePath(inDirectory: fs.cachesDirectory.appending("/Camera"), withExtension: ".jpg")
  let generatedPhoto = ABI48_0_0EXCameraUtils.generatePhoto(of: CGSize(width: 200, height: 200))
  let photoData = generatedPhoto.jpegData(compressionQuality: options.quality)

  return [
    "uri": ABI48_0_0EXCameraUtils.writeImage(photoData, toPath: path),
    "width": generatedPhoto.size.width,
    "height": generatedPhoto.size.height,
    "base64": options.base64 ? photoData?.base64EncodedString() : nil
  ]
}

private func getAvailableVideoCodecs() -> [String] {
  let session = AVCaptureSession()

  session.beginConfiguration()

  guard let captureDevice = ABI48_0_0EXCameraUtils.device(withMediaType: AVMediaType.video.rawValue, preferring: AVCaptureDevice.Position.front) else {
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
