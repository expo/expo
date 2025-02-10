// Copyright 2022-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore
import VisionKit

let cameraEvents = ["onCameraReady", "onMountError", "onPictureSaved", "onBarcodeScanned", "onResponsiveOrientationChanged"]

struct ScannerContext {
  var controller: Any?
  var delegate: Any?
}

public final class CameraViewModule: Module, ScannerResultHandler {
  private var scannerContext: ScannerContext?

  public func definition() -> ModuleDefinition {
    Name("ExpoCamera")

    Events("onModernBarcodeScanned")

    OnCreate {
      let permissionsManager = self.appContext?.permissions
      EXPermissionsMethodsDelegate.register(
        [
          CameraOnlyPermissionRequester(),
          CameraMicrophonePermissionRequester()
        ],
        withPermissionsManager: permissionsManager
      )
    }

    Property("isModernBarcodeScannerAvailable") { () -> Bool in
      if #available(iOS 16.0, *) {
        return true
      }
      return false
    }

    AsyncFunction("scanFromURLAsync") { (url: URL, _: [BarcodeType], promise: Promise) in
      guard let imageLoader = appContext?.imageLoader else {
        throw ImageLoaderNotFound()
      }

      imageLoader.loadImage(for: url) { error, image in
        if error != nil {
          promise.reject(FailedToLoadImage())
          return
        }

        guard let cgImage = image?.cgImage else {
          promise.reject(FailedToLoadImage())
          return
        }

        guard let detector = CIDetector(
          ofType: CIDetectorTypeQRCode,
          context: nil,
          options: [CIDetectorAccuracy: CIDetectorAccuracyHigh]
        ) else {
          promise.reject(InitScannerFailed())
          return
        }

        let ciImage = CIImage(cgImage: cgImage)
        let features = detector.features(in: ciImage)
        promise.resolve(BarcodeUtils.getResultFrom(features))
      }
    }

    // swiftlint:disable:next closure_body_length
    View(CameraView.self) {
      Events(cameraEvents)

      Prop("facing") { (view, type: CameraType?) in
        if let type, view.presetCamera != type.toPosition() {
          view.presetCamera = type.toPosition()
        }
        // the prop has been removed, reset to default
        if type == nil && view.presetCamera != .back {
          view.presetCamera = .back
        }
      }

      Prop("flashMode") { (view, flashMode: FlashMode?) in
        if let flashMode, view.flashMode != flashMode {
          view.flashMode = flashMode
        }
        if flashMode == nil && view.flashMode != .auto {
          view.flashMode = .auto
        }
      }

      Prop("enableTorch") { (view, enabled: Bool?) in
        if let enabled, view.torchEnabled != enabled {
          view.torchEnabled = enabled
          return
        }
        if enabled == nil && view.torchEnabled {
          view.torchEnabled = false
        }
      }

      Prop("pictureSize") { (view, pictureSize: PictureSize?) in
        if let pictureSize, view.pictureSize != pictureSize {
          view.pictureSize = pictureSize
          return
        }
        if pictureSize == nil && view.pictureSize != .high {
          view.pictureSize = .high
        }
      }

      Prop("zoom") { (view, zoom: Double?) in
        if let zoom, fabs(view.zoom - zoom) > Double.ulpOfOne {
          view.zoom = zoom
          return
        }
        if zoom == nil && view.zoom != 0 {
          view.zoom = 0
        }
      }

      Prop("mode") { (view, mode: CameraMode?) in
        if let mode, view.mode != mode {
          view.mode = mode
        }
        if mode == nil && view.mode != .picture {
          view.mode = .picture
        }
      }

      Prop("barcodeScannerEnabled") { (view, scanBarcodes: Bool?) in
        if let scanBarcodes, view.isScanningBarcodes != scanBarcodes {
          view.isScanningBarcodes = scanBarcodes
          return
        }
        if scanBarcodes == nil && view.isScanningBarcodes != false {
          view.isScanningBarcodes = false
        }
      }

      Prop("barcodeScannerSettings") { (view, settings: BarcodeSettings?) in
        if let settings {
          view.setBarcodeScannerSettings(settings: settings)
        }
      }

      Prop("mute") { (view, muted: Bool?) in
        if let muted, view.isMuted != muted {
          view.isMuted = muted
          return
        }
        if muted == nil && view.isMuted != false {
          view.isMuted = false
        }
      }

      Prop("animateShutter") { (view, animate: Bool?) in
        // Does not call anything that immediately causes any configuration changes
        // so it's fine to just set it
        view.animateShutter = animate ?? true
      }

      Prop("videoQuality") { (view, quality: VideoQuality?) in
        if let quality, view.videoQuality != quality {
          view.videoQuality = quality
          return
        }
        if quality == nil && view.videoQuality != .video1080p {
          view.videoQuality = .video1080p
        }
      }

      Prop("autoFocus") { (view, focusMode: FocusMode?) in
        if let focusMode, view.autoFocus != focusMode.toAVCaptureFocusMode() {
          view.autoFocus = focusMode.toAVCaptureFocusMode()
          return
        }
        if focusMode == nil && view.autoFocus != .continuousAutoFocus {
          view.autoFocus = .continuousAutoFocus
        }
      }

      Prop("responsiveOrientationWhenOrientationLocked") { (view, responsiveOrientation: Bool?) in
        if let responsiveOrientation, view.responsiveWhenOrientationLocked != responsiveOrientation {
          view.responsiveWhenOrientationLocked = responsiveOrientation
          return
        }
        if responsiveOrientation == nil && view.responsiveWhenOrientationLocked != false {
          view.responsiveWhenOrientationLocked = false
        }
      }

      Prop("mirror") { (view, mirror: Bool?) in
        // Does not call anything that immediately causes any configuration changes
        // so it's fine to just set it
        view.mirror = mirror ?? false
      }

      Prop("active") { (view, active: Bool?) in
        if let active, view.active != active {
          view.active = active
          return
        }
        if active == nil && view.active != true {
          view.active = true
        }
      }

      Prop("videoBitrate") { (view, bitrate: Int?) in
        // Does not call anything that immediately causes any configuration changes
        // so it's fine to just set it
        view.videoBitrate = bitrate
      }

      AsyncFunction("resumePreview") { view in
        view.resumePreview()
      }

      AsyncFunction("pausePreview") { view in
        view.pausePreview()
      }

      AsyncFunction("getAvailablePictureSizes") { (_: String?) in
        return PictureSize.allCases.map {
          $0.rawValue
        }
      }

      AsyncFunction("takePicture") { (view, options: TakePictureOptions, promise: Promise) in
        #if targetEnvironment(simulator) // simulator
        try takePictureForSimulator(self.appContext, view, options, promise)
        #else // not simulator
        Task {
          await view.takePicture(options: options, promise: promise)
        }
        #endif
      }

      AsyncFunction("record") { (view, options: CameraRecordingOptions, promise: Promise) in
        #if targetEnvironment(simulator)
        throw Exceptions.SimulatorNotSupported()
        #else
        Task {
          await view.record(options: options, promise: promise)
        }
        #endif
      }

      AsyncFunction("stopRecording") { view in
        #if targetEnvironment(simulator)
        throw Exceptions.SimulatorNotSupported()
        #else
        view.stopRecording()
        #endif
      }
    }

    AsyncFunction("launchScanner") { (options: VisionScannerOptions?) in
      if #available(iOS 16.0, *) {
        await MainActor.run {
          let delegate = VisionScannerDelegate(handler: self)
          scannerContext = ScannerContext(delegate: delegate)
          launchScanner(with: options)
        }
      }
    }

    AsyncFunction("dismissScanner") {
      if #available(iOS 16.0, *) {
        await MainActor.run {
          dismissScanner()
        }
      }
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

    AsyncFunction("getAvailableVideoCodecsAsync") { () -> [String] in
      return getAvailableVideoCodecs()
    }
  }

  @available(iOS 16.0, *)
  @MainActor
  private func launchScanner(with options: VisionScannerOptions?) {
    let symbologies = options?.toSymbology() ?? [.qr]
    let controller = DataScannerViewController(
      recognizedDataTypes: [.barcode(symbologies: symbologies)],
      isPinchToZoomEnabled: options?.isPinchToZoomEnabled ?? true,
      isGuidanceEnabled: options?.isGuidanceEnabled ?? true,
      isHighlightingEnabled: options?.isHighlightingEnabled ?? false
    )

    scannerContext?.controller = controller
    if let delegate = scannerContext?.delegate as? VisionScannerDelegate {
      controller.delegate = delegate
    }

    appContext?.utilities?.currentViewController()?.present(controller, animated: true) {
      try? controller.startScanning()
    }
  }

  @available(iOS 16.0, *)
  @MainActor
  private func dismissScanner() {
    guard let controller = scannerContext?.controller as? DataScannerViewController else {
      return
    }
    controller.stopScanning()
    controller.dismiss(animated: true)
  }

  func onItemScanned(result: [String: Any]) {
    sendEvent("onModernBarcodeScanned", result)
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
}
