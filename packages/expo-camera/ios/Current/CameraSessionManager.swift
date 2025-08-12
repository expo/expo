import UIKit
@preconcurrency import AVFoundation
import ExpoModulesCore

protocol CameraSessionManagerDelegate: AnyObject {
  var sessionQueue: DispatchQueue { get }
  var videoQuality: VideoQuality { get }
  var mode: CameraMode { get }
  var pictureSize: PictureSize { get }
  var isMuted: Bool { get }
  var active: Bool { get }
  var presetCamera: AVCaptureDevice.Position { get }
  var selectedLens: String? { get }
  var torchEnabled: Bool { get }
  var autoFocus: AVCaptureDevice.FocusMode { get }
  var zoom: CGFloat { get }
  var onMountError: EventDispatcher { get }
  var onCameraReady: EventDispatcher { get }
  var permissionsManager: EXPermissionsInterface? { get }
  var appContext: AppContext? { get }
  var barcodeScanner: BarcodeScanner? { get }

  func emitAvailableLenses()
  func changePreviewOrientation()
}

class CameraSessionManager: NSObject {
  weak var delegate: CameraSessionManagerDelegate?

  let session = AVCaptureSession()
  private let deviceDiscovery = DeviceDiscovery()

  private var captureDeviceInput: AVCaptureDeviceInput?
  private var photoOutput: AVCapturePhotoOutput?
  private var videoFileOutput: AVCaptureMovieFileOutput?

  init(delegate: CameraSessionManagerDelegate) {
    self.delegate = delegate
    super.init()
  }

  func initializeCaptureSessionInput() {
    guard let delegate else {
      return
    }
    delegate.sessionQueue.async {
      self.updateDevice()
      self.startSession()
    }
  }

  func updateSessionPreset(preset: AVCaptureSession.Preset) {
#if !targetEnvironment(simulator)
    if session.canSetSessionPreset(preset) {
      if session.sessionPreset != preset {
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        session.sessionPreset = preset
      }
    } else {
      // The selected preset cannot be used on the current device so we fall back to the highest available.
      if session.sessionPreset != .high {
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        session.sessionPreset = .high
      }
    }
#endif
  }

  func updateDevice() {
    guard let delegate else {
      return
    }

    let lenses = delegate.presetCamera == .back
    ? deviceDiscovery.backCameraLenses
    : deviceDiscovery.frontCameraLenses

    let selectedDevice = lenses.first {
      $0.localizedName == delegate.selectedLens
    }

    if let selectedDevice {
      addDevice(selectedDevice)
    } else {
      let device = delegate.presetCamera == .back
      ? deviceDiscovery.defaultBackCamera
      : deviceDiscovery.defaultFrontCamera

      if let device {
        addDevice(device)
      }
    }
  }

  func updateCameraIsActive() {
    guard let delegate else {
      return
    }
    delegate.sessionQueue.async {
      if delegate.active {
        if !self.session.isRunning {
          self.session.startRunning()
        }
      } else {
        self.session.stopRunning()
      }
    }
  }

  func setCameraMode() {
    guard let delegate else {
      return
    }

    if delegate.mode == .video {
      if videoFileOutput == nil {
        setupMovieFileCapture()
      }
      updateSessionAudioIsMuted()
    } else {
      cleanupMovieFileCapture()
    }
  }

  func updateSessionAudioIsMuted() {
    guard let delegate else {
      return
    }

    session.beginConfiguration()
    defer { session.commitConfiguration() }

    if delegate.isMuted {
      for input in session.inputs {
        if let deviceInput = input as? AVCaptureDeviceInput {
          if deviceInput.device.hasMediaType(.audio) {
            session.removeInput(input)
            return
          }
        }
      }
    }

    if !delegate.isMuted && delegate.mode == .video {
      if let audioCapturedevice = AVCaptureDevice.default(for: .audio) {
        do {
          let audioDeviceInput = try AVCaptureDeviceInput(device: audioCapturedevice)
          if session.canAddInput(audioDeviceInput) {
            session.addInput(audioDeviceInput)
          }
        } catch {
          log.info("\(#function): \(error.localizedDescription)")
        }
      }
    }
  }

  func enableTorch() {
    guard let delegate, let device = captureDeviceInput?.device, device.hasTorch else {
      return
    }

    do {
      try device.lockForConfiguration()
      if device.hasTorch && device.isTorchModeSupported(.on) {
        device.torchMode = delegate.torchEnabled ? .on : .off
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }
    device.unlockForConfiguration()
  }

  func setFocusMode() {
    guard let device = captureDeviceInput?.device, let delegate else {
      return
    }

    do {
      try device.lockForConfiguration()
      if device.isFocusModeSupported(delegate.autoFocus), device.focusMode != delegate.autoFocus {
        device.focusMode = delegate.autoFocus
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
      return
    }
    device.unlockForConfiguration()
  }

  func updateZoom() {
    guard let device = captureDeviceInput?.device, let delegate else {
      return
    }

    do {
      try device.lockForConfiguration()
      let minZoom = 1.0
      device.videoZoomFactor = minZoom * pow(device.activeFormat.videoMaxZoomFactor / minZoom, delegate.zoom)
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }

    device.unlockForConfiguration()
  }

  func getAvailableLenses() -> [String] {
    guard let delegate else {
      return []
    }

    let availableLenses = delegate.presetCamera == AVCaptureDevice.Position.back
    ? deviceDiscovery.backCameraLenses
    : deviceDiscovery.frontCameraLenses

    // Lens ordering can be varied which causes problems if you keep the result in react state.
    // We sort them to provide a stable ordering
    return availableLenses.map { $0.localizedName }.sorted {
      $0 < $1
    }
  }

  func setupMovieFileCapture() {
    let output = AVCaptureMovieFileOutput()
    if session.canAddOutput(output) {
      session.addOutput(output)
      videoFileOutput = output
    }
  }

  func cleanupMovieFileCapture() {
    if let videoFileOutput {
      if session.outputs.contains(videoFileOutput) {
        session.removeOutput(videoFileOutput)
        self.videoFileOutput = nil
      }
    }
  }

  func stopSession() {
#if targetEnvironment(simulator)
    return
#else
    session.beginConfiguration()
    for input in self.session.inputs {
      session.removeInput(input)
    }

    for output in session.outputs {
      session.removeOutput(output)
    }
    session.commitConfiguration()

    if session.isRunning {
      session.stopRunning()
    }
#endif
  }

  func addErrorNotification() {
    guard let delegate else {
      return
    }

    Task {
      let errors = NotificationCenter.default.notifications(named: .AVCaptureSessionRuntimeError, object: self.session)
        .compactMap({ $0.userInfo?[AVCaptureSessionErrorKey] as? AVError })
      for await error in errors where error.code == .mediaServicesWereReset {
        if !session.isRunning {
          session.startRunning()
        }
        delegate.sessionQueue.async {
          self.updateSessionAudioIsMuted()
        }
        delegate.onMountError(["message": "Camera session was reset"])
      }
    }
  }

  var currentPhotoOutput: AVCapturePhotoOutput? {
    return photoOutput
  }

  var currentVideoFileOutput: AVCaptureMovieFileOutput? {
    return videoFileOutput
  }

  var currentDevice: AVCaptureDevice? {
    return captureDeviceInput?.device
  }

  private func addDevice(_ device: AVCaptureDevice) {
    guard let delegate else {
      return
    }

    session.beginConfiguration()
    defer {
      session.commitConfiguration()
      delegate.emitAvailableLenses()
    }
    if let captureDeviceInput {
      session.removeInput(captureDeviceInput)
    }

    do {
      let deviceInput = try AVCaptureDeviceInput(device: device)
      if session.canAddInput(deviceInput) {
        session.addInput(deviceInput)
        captureDeviceInput = deviceInput
        updateZoom()
      }
    } catch {
      delegate.onMountError(["message": "Camera could not be started - \(error.localizedDescription)"])
    }
  }

  private func startSession() {
#if targetEnvironment(simulator)
    return
#else
    guard let delegate else {
      return
    }
    guard let manager = delegate.permissionsManager else {
      log.info("Permissions module not found.")
      return
    }
    if !manager.hasGrantedPermission(usingRequesterClass: CameraOnlyPermissionRequester.self) {
      delegate.onMountError(["message": "Camera permissions not granted - component could not be rendered."])
      return
    }

    let photoOutput = AVCapturePhotoOutput()
    photoOutput.isLivePhotoCaptureEnabled = false
    session.beginConfiguration()
    if session.canAddOutput(photoOutput) {
      session.addOutput(photoOutput)
      self.photoOutput = photoOutput
    }

    session.sessionPreset = delegate.mode == .video
    ? delegate.videoQuality.toPreset()
    : delegate.pictureSize.toCapturePreset()

    session.commitConfiguration()
    addErrorNotification()
    delegate.changePreviewOrientation()
    delegate.barcodeScanner?.maybeStartBarcodeScanning()
    updateCameraIsActive()
    DispatchQueue.main.async { [weak delegate] in
      delegate?.onCameraReady()
    }
    enableTorch()
#endif
  }
}
