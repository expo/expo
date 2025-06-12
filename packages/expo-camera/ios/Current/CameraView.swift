import UIKit
@preconcurrency import ExpoModulesCore
import CoreMotion

public class CameraView: ExpoView, EXAppLifecycleListener, EXCameraInterface, CameraEvent,
  CameraSessionManagerDelegate, CameraPhotoCaptureDelegate, CameraVideoRecordingDelegate {
  public var sessionQueue = DispatchQueue(label: "captureSessionQueue")
  // Needed to satisfy EXCameraInterface
  // swiftlint:disable implicitly_unwrapped_optional
  public var session: AVCaptureSession!
  private var sessionManager: CameraSessionManager!
  private var photoCapture: CameraPhotoCapture!
  private var videoRecording: CameraVideoRecording!
  // swiftlint:enable implicitly_unwrapped_optional

  private var lifecycleManager: EXAppLifecycleService?
  internal var permissionsManager: EXPermissionsInterface?

  internal var barcodeScanner: BarcodeScanner?
  internal lazy var previewLayer = AVCaptureVideoPreviewLayer(session: self.session)

  internal var physicalOrientation: UIDeviceOrientation = .unknown
  private var motionManager: CMMotionManager = {
    let mm = CMMotionManager()
    mm.accelerometerUpdateInterval = 0.2
    mm.gyroUpdateInterval = 0.2
    return mm
  }()
  private var isSessionPaused = false

  // MARK: Property Observers

  var responsiveWhenOrientationLocked = false {
    didSet {
      updateResponsiveOrientation()
    }
  }

  var videoQuality: VideoQuality = .video1080p {
    didSet {
      sessionQueue.async {
        self.sessionManager.updateSessionPreset(preset: self.videoQuality.toPreset())
      }
    }
  }

  var isScanningBarcodes = false {
    didSet {
      sessionQueue.async { [weak self] in
        guard let self else {
          return
        }
        barcodeScanner?.setIsEnabled(isScanningBarcodes)
      }
    }
  }

  internal var videoBitrate: Int?

  var presetCamera = AVCaptureDevice.Position.back {
    didSet {
      sessionQueue.async {
        self.sessionManager.updateDevice()
      }
    }
  }

  var flashMode = FlashMode.auto

  var torchEnabled = false {
    didSet {
      sessionManager.enableTorch()
    }
  }

  var autoFocus = AVCaptureDevice.FocusMode.continuousAutoFocus {
    didSet {
      sessionManager.setFocusMode()
    }
  }

  var pictureSize = PictureSize.high {
    didSet {
      updatePictureSize()
    }
  }

  var mode = CameraMode.picture {
    didSet {
      sessionQueue.async {
        self.sessionManager.setCameraMode()
      }
    }
  }

  var isMuted = false {
    didSet {
      sessionQueue.async {
        self.sessionManager.updateSessionAudioIsMuted()
      }
    }
  }

  var active = true {
    didSet {
      sessionQueue.async {
        self.sessionManager.updateCameraIsActive()
      }
    }
  }

  var selectedLens: String? {
    didSet {
      sessionQueue.async {
        self.sessionManager.updateDevice()
      }
    }
  }

  var animateShutter = true
  var mirror = false

  var zoom: CGFloat = 0 {
    didSet {
      sessionManager.updateZoom()
    }
  }

  // MARK: - Events

  let onCameraReady = EventDispatcher()
  let onMountError = EventDispatcher()
  let onPictureSaved = EventDispatcher()
  let onBarcodeScanned = EventDispatcher()
  let onResponsiveOrientationChanged = EventDispatcher()
  let onAvailableLensesChanged = EventDispatcher()

  internal var deviceOrientation: UIInterfaceOrientation {
    UIApplication.shared.connectedScenes.compactMap {
      $0 as? UIWindowScene
    }.first?.interfaceOrientation ?? .unknown
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    lifecycleManager = appContext?.legacyModule(implementing: EXAppLifecycleService.self)
    permissionsManager = appContext?.legacyModule(implementing: EXPermissionsInterface.self)

    sessionManager = CameraSessionManager(delegate: self)
    photoCapture = CameraPhotoCapture(delegate: self)
    videoRecording = CameraVideoRecording(delegate: self)
    session = sessionManager.session

    #if !targetEnvironment(simulator)
    setupPreview()
    #endif
    barcodeScanner = createBarcodeScanner()
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(orientationChanged),
      name: UIDevice.orientationDidChangeNotification,
      object: nil)
    lifecycleManager?.register(self)
    sessionManager.initializeCaptureSessionInput()
  }

  private func setupPreview() {
    previewLayer = AVCaptureVideoPreviewLayer(session: sessionManager.session)
    previewLayer.videoGravity = .resizeAspectFill
    previewLayer.needsDisplayOnBoundsChange = true
  }

  public func onAppForegrounded() {
    sessionQueue.async { [weak self] in
      guard let self else {
        return
      }
      if !session.isRunning && isSessionPaused {
        isSessionPaused = false
        session.startRunning()
        if torchEnabled {
          sessionManager.enableTorch()
        }
      }
    }
  }

  public func onAppBackgrounded() {
    sessionQueue.async { [weak self] in
      guard let self else {
        return
      }
      if session.isRunning && !isSessionPaused {
        isSessionPaused = true
        session.stopRunning()
      }
    }
  }

  private func updatePictureSize() {
#if !targetEnvironment(simulator)
    sessionQueue.async {
      let preset = self.pictureSize.toCapturePreset()
      self.sessionManager.updateSessionPreset(preset: preset)
    }
#endif
  }

  func setBarcodeScannerSettings(settings: BarcodeSettings) {
    sessionQueue.async {
      self.barcodeScanner?.setSettings([BARCODE_TYPES_KEY: settings.toMetadataObjectType()])
    }
  }

  func emitAvailableLenses() {
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }
      self.onAvailableLensesChanged([
        "lenses": self.sessionManager.getAvailableLenses()
      ])
    }
  }

  func getAvailableLenses() -> [String] {
    return sessionManager.getAvailableLenses()
  }

  func updateResponsiveOrientation() {
    if responsiveWhenOrientationLocked {
      motionManager.startAccelerometerUpdates(to: OperationQueue()) { [weak self] _, error in
        if error != nil {
          return
        }
        guard let self, let accelerometerData = self.motionManager.accelerometerData else {
          return
        }

        let deviceOrientation = ExpoCameraUtils.deviceOrientation(
          for: accelerometerData,
          default: self.physicalOrientation)
        if deviceOrientation != self.physicalOrientation {
          self.physicalOrientation = deviceOrientation
          self.onResponsiveOrientationChanged(["orientation": ExpoCameraUtils.toOrientationString(orientation: deviceOrientation)])
        }
      }
    } else {
      motionManager.stopAccelerometerUpdates()
    }
  }

  func takePictureRef(options: TakePictureOptions) async throws -> PictureRef {
    guard let photoOutput = sessionManager.currentPhotoOutput else {
      throw CameraOutputNotReadyException()
    }
    return try await photoCapture.takePictureRef(options: options, photoOutput: photoOutput)
  }

  func takePicturePromise(options: TakePictureOptions) async throws -> [String: Any] {
    guard let photoOutput = sessionManager.currentPhotoOutput else {
      throw CameraOutputNotReadyException()
    }
    return try await photoCapture.takePicturePromise(options: options, photoOutput: photoOutput)
  }

  func record(options: CameraRecordingOptions, promise: Promise) async {
    guard let videoFileOutput = sessionManager.currentVideoFileOutput else {
      promise.reject(CameraOutputNotReadyException())
      return
    }
    await videoRecording.record(options: options, videoFileOutput: videoFileOutput, promise: promise)
  }

  @available(iOS 18.0, *)
  func toggleRecording() {
    guard let videoFileOutput = sessionManager.currentVideoFileOutput else {
      return
    }
    videoRecording.toggleRecording(videoFileOutput: videoFileOutput)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    self.backgroundColor = .black
    previewLayer.frame = self.bounds
    self.layer.insertSublayer(previewLayer, at: 0)
  }

  public override func removeFromSuperview() {
    super.removeFromSuperview()
    sessionQueue.async {
      self.sessionManager.stopSession()
    }
    lifecycleManager?.unregisterAppLifecycleListener(self)
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
  }

  func stopRecording() {
    videoRecording.stopRecording(videoFileOutput: sessionManager.currentVideoFileOutput)
  }

  func resumePreview() {
    previewLayer.connection?.isEnabled = true
  }

  func pausePreview() {
    previewLayer.connection?.isEnabled = false
  }

  @objc func orientationChanged() {
    changePreviewOrientation()
  }

  func changePreviewOrientation() {
    // We shouldn't access the device orientation anywhere but on the main thread
    Task { @MainActor in
      let videoOrientation = ExpoCameraUtils.videoOrientation(for: deviceOrientation)
      if (previewLayer.connection?.isVideoOrientationSupported) == true {
        physicalOrientation = ExpoCameraUtils.physicalOrientation(for: deviceOrientation)
        previewLayer.connection?.videoOrientation = videoOrientation
      }
    }
  }

  private func createBarcodeScanner() -> BarcodeScanner {
    let scanner = BarcodeScanner(session: session, sessionQueue: sessionQueue)

    scanner.setPreviewLayer(layer: previewLayer)
    scanner.setOnBarcodeScanned { [weak self] body in
      guard let self else {
        return
      }
      if let body {
        self.onBarcodeScanned(body)
      }
    }

    return scanner
  }

  deinit {
    photoCapture.cleanup()
    videoRecording.cleanup()
  }
}
