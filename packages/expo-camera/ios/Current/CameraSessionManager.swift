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

class CameraSessionManager: NSObject, DeviceDiscoveryDelegate {
  weak var delegate: CameraSessionManagerDelegate?

  let session = AVCaptureSession()
  private let deviceDiscovery = DeviceDiscovery()

  private var captureDeviceInput: AVCaptureDeviceInput?
  private var photoOutput: AVCapturePhotoOutput?
  private var videoFileOutput: AVCaptureMovieFileOutput?
  private var runtimeErrorTask: Task<Void, Never>?

  init(delegate: CameraSessionManagerDelegate) {
    self.delegate = delegate
    super.init()
    deviceDiscovery.delegate = self
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

  func updateSessionPreset(preset: AVCaptureSession.Preset, withSessionConfiguration: Bool = true) {
#if !targetEnvironment(simulator)
    if session.canSetSessionPreset(preset) {
      if session.sessionPreset != preset {
        if withSessionConfiguration {
          session.beginConfiguration()
        }
        session.sessionPreset = preset
        if withSessionConfiguration {
          session.commitConfiguration()
        }
      }
    } else {
      // The selected preset cannot be used on the current device so we fall back to the highest available.
      if session.sessionPreset != .high {
        if withSessionConfiguration {
          session.beginConfiguration()
        }
        session.sessionPreset = .high
        if withSessionConfiguration {
          session.commitConfiguration()
        }
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
    if delegate.active {
      if !self.session.isRunning {
        self.session.startRunning()
      }
    } else {
      self.session.stopRunning()
    }
  }

  func setCameraMode() {
    guard let delegate else {
      return
    }
    self.session.beginConfiguration()
    defer { self.session.commitConfiguration() }
    if delegate.mode == .video {
      if self.videoFileOutput == nil {
        self.setupMovieFileCapture(withSessionConfiguration: false)
      }
      self.updateSessionAudioIsMuted(withSessionConfiguration: false)
      self.updateSessionPreset(preset: delegate.videoQuality.toPreset(), withSessionConfiguration: false)
    } else {
      self.cleanupMovieFileCapture(withSessionConfiguration: false)
      self.updateSessionPreset(preset: delegate.pictureSize.toCapturePreset(), withSessionConfiguration: false)
    }
  }

  func updateSessionAudioIsMuted(withSessionConfiguration: Bool = true) {
    guard let delegate else {
      return
    }

    if withSessionConfiguration {
      session.beginConfiguration()
    }
    defer {
      if withSessionConfiguration {
        session.commitConfiguration()
      }
    }

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
      defer { device.unlockForConfiguration() }
      if device.hasTorch && device.isTorchModeSupported(.on) {
        device.torchMode = delegate.torchEnabled ? .on : .off
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }
  }

  func setFocusMode() {
    guard let device = captureDeviceInput?.device, let delegate else {
      return
    }

    do {
      try device.lockForConfiguration()
      defer { device.unlockForConfiguration() }
      if device.isFocusModeSupported(delegate.autoFocus), device.focusMode != delegate.autoFocus {
        device.focusMode = delegate.autoFocus
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }
  }

  func updateZoom() {
    guard let device = captureDeviceInput?.device, let delegate else {
      return
    }

    do {
      try device.lockForConfiguration()
      defer { device.unlockForConfiguration() }
      let minZoom = 1.0
      device.videoZoomFactor = minZoom * pow(device.activeFormat.videoMaxZoomFactor / minZoom, delegate.zoom)
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }
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

  func setupMovieFileCapture(withSessionConfiguration: Bool = true) {
    let output = AVCaptureMovieFileOutput()
    if withSessionConfiguration {
      session.beginConfiguration()
    }
    defer {
      if withSessionConfiguration {
        session.commitConfiguration()
      }
    }
    if session.canAddOutput(output) {
      session.addOutput(output)
      videoFileOutput = output
    }
  }

  func cleanupMovieFileCapture(withSessionConfiguration: Bool = true) {
    guard let videoFileOutput else {
      return
    }
    if withSessionConfiguration {
      session.beginConfiguration()
    }
    defer {
      if withSessionConfiguration {
        session.commitConfiguration()
      }
    }
    if session.outputs.contains(videoFileOutput) {
      session.removeOutput(videoFileOutput)
      self.videoFileOutput = nil
    }
  }

  func stopSession() {
#if targetEnvironment(simulator)
    return
#else
    runtimeErrorTask?.cancel()
    runtimeErrorTask = nil
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

    runtimeErrorTask?.cancel()
    runtimeErrorTask = Task {
      let errors = NotificationCenter.default.notifications(named: .AVCaptureSessionRuntimeError, object: self.session)
        .compactMap({ $0.userInfo?[AVCaptureSessionErrorKey] as? AVError })
      for await error in errors where error.code == .mediaServicesWereReset {
        delegate.sessionQueue.async {
          if !self.session.isRunning {
            self.session.startRunning()
          }
          self.updateSessionAudioIsMuted()
        }
        delegate.onMountError(["message": "Camera session was reset"])
      }
    }
  }

  deinit {
    runtimeErrorTask?.cancel()
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

  func deviceDiscovery(_ discovery: DeviceDiscovery, didUpdateDevices devices: [AVCaptureDevice]) {
    DispatchQueue.main.async { [weak self] in
      self?.delegate?.emitAvailableLenses()
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

    let preset = delegate.mode == .video
    ? delegate.videoQuality.toPreset()
    : delegate.pictureSize.toCapturePreset()
    updateSessionPreset(preset: preset, withSessionConfiguration: false)

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
