import UIKit
import ExpoModulesCore
import CoreMotion

public class CameraView: ExpoView, EXAppLifecycleListener,
  AVCaptureFileOutputRecordingDelegate, AVCapturePhotoCaptureDelegate, EXCameraInterface, CameraEvent {
  public var session = AVCaptureSession()
  public var sessionQueue = DispatchQueue(label: "captureSessionQueue")

  // MARK: - Legacy Modules

  private var lifecycleManager: EXAppLifecycleService?
  private var permissionsManager: EXPermissionsInterface?

  // MARK: - Properties

  private var barcodeScanner: BarcodeScanner?
  private lazy var previewLayer = AVCaptureVideoPreviewLayer(session: self.session)
  private var isValidVideoOptions = true
  private var videoCodecType: AVVideoCodecType?
  private var photoCaptureOptions: TakePictureOptions?
  private var physicalOrientation: UIDeviceOrientation = .unknown
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
        self.updateSessionPreset(preset: self.videoQuality.toPreset())
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

  var videoBitrate: Int?

  var presetCamera = AVCaptureDevice.Position.back {
    didSet {
      sessionQueue.async {
        self.updateDevice()
      }
    }
  }

  var flashMode = FlashMode.auto

  var torchEnabled = false {
    didSet {
      enableTorch()
    }
  }

  var autoFocus = AVCaptureDevice.FocusMode.continuousAutoFocus {
    didSet {
      setFocusMode()
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
        self.setCameraMode()
      }
    }
  }

  var isMuted = false {
    didSet {
      sessionQueue.async {
        self.updateSessionAudioIsMuted()
      }
    }
  }

  var active = true {
    didSet {
      sessionQueue.async {
        self.updateCameraIsActive()
      }
    }
  }

  var animateShutter = true
  var mirror = false

  var zoom: CGFloat = 0 {
    didSet {
      updateZoom()
    }
  }

  // MARK: - Session Inputs and Outputs

  private var videoFileOutput: AVCaptureMovieFileOutput?
  private var photoOutput: AVCapturePhotoOutput?
  private var captureDeviceInput: AVCaptureDeviceInput?

  // MARK: - Promises

  private var photoCapturedPromise: Promise?
  private var videoRecordedPromise: Promise?

  // MARK: - Events

  let onCameraReady = EventDispatcher()
  let onMountError = EventDispatcher()
  let onPictureSaved = EventDispatcher()
  let onBarcodeScanned = EventDispatcher()
  let onResponsiveOrientationChanged = EventDispatcher()

  private var deviceOrientation: UIInterfaceOrientation {
    UIApplication.shared.connectedScenes.compactMap {
      $0 as? UIWindowScene
    }.first?.interfaceOrientation ?? .unknown
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    lifecycleManager = appContext?.legacyModule(implementing: EXAppLifecycleService.self)
    permissionsManager = appContext?.legacyModule(implementing: EXPermissionsInterface.self)
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
    initializeCaptureSessionInput()
  }

  private func setupPreview() {
    previewLayer.videoGravity = .resizeAspectFill
    previewLayer.needsDisplayOnBoundsChange = true
  }

  private func updateDevice() {
    guard let device = ExpoCameraUtils.device(with: .video, preferring: presetCamera) else {
      return
    }

    session.beginConfiguration()
    defer { session.commitConfiguration() }
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
      onMountError(["message": "Camera could not be started - \(error.localizedDescription)"])
    }
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
          enableTorch()
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
      if self.session.canSetSessionPreset(preset) {
        self.session.sessionPreset = preset
      }
    }
#endif
  }

  private func enableTorch() {
    guard let device = captureDeviceInput?.device, device.hasTorch else {
      return
    }

    do {
      try device.lockForConfiguration()
      if device.hasTorch && device.isTorchModeSupported(.on) {
        device.torchMode = torchEnabled ? .on : .off
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }
    device.unlockForConfiguration()
  }

  private func setFocusMode() {
    guard let device = captureDeviceInput?.device else {
      return
    }

    do {
      try device.lockForConfiguration()
      if device.isFocusModeSupported(autoFocus), device.focusMode != autoFocus {
        device.focusMode = autoFocus
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
      return
    }
    device.unlockForConfiguration()
  }

  private func setCameraMode() {
    if mode == .video {
      if videoFileOutput == nil {
        setupMovieFileCapture()
      }
      updateSessionAudioIsMuted()
    } else {
      cleanupMovieFileCapture()
    }
  }

  private func startSession() {
#if targetEnvironment(simulator)
    return
#else
    guard let manager = permissionsManager else {
      log.info("Permissions module not found.")
      return
    }
    if !manager.hasGrantedPermission(usingRequesterClass: CameraOnlyPermissionRequester.self) {
      onMountError(["message": "Camera permissions not granted - component could not be rendered."])
      return
    }

    let photoOutput = AVCapturePhotoOutput()
    photoOutput.isLivePhotoCaptureEnabled = false
    session.beginConfiguration()
    if session.canAddOutput(photoOutput) {
      session.addOutput(photoOutput)
      self.photoOutput = photoOutput
    }

    session.sessionPreset = mode == .video ? pictureSize.toCapturePreset() : .photo
    session.commitConfiguration()
    addErrorNotification()
    changePreviewOrientation()
    barcodeScanner?.maybeStartBarcodeScanning()
    updateCameraIsActive()
    onCameraReady()
    enableTorch()
#endif
  }

  private func updateZoom() {
    guard let device = captureDeviceInput?.device else {
      return
    }

    do {
      try device.lockForConfiguration()
      let minZoom = 1.0
      device.videoZoomFactor = minZoom * pow(device.activeFormat.videoMaxZoomFactor / minZoom, zoom)
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }

    device.unlockForConfiguration()
  }

  private func addErrorNotification() {
    Task {
      let errors = NotificationCenter.default.notifications(named: .AVCaptureSessionRuntimeError, object: self.session)
        .compactMap({ $0.userInfo?[AVCaptureSessionErrorKey] as? AVError })
      for await error in errors where error.code == .mediaServicesWereReset {
        if !session.isRunning {
          session.startRunning()
        }
        sessionQueue.async {
          self.updateSessionAudioIsMuted()
        }
        onCameraReady()
      }
    }
  }

  func setBarcodeScannerSettings(settings: BarcodeSettings) {
    sessionQueue.async {
      self.barcodeScanner?.setSettings([BARCODE_TYPES_KEY: settings.toMetadataObjectType()])
    }
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

  func takePicture(options: TakePictureOptions, promise: Promise) async {
    if photoCapturedPromise != nil {
      promise.reject(CameraNotReadyException())
      return
    }

    guard let photoOutput else {
      promise.reject(CameraOutputNotReadyException())
      return
    }

    photoCapturedPromise = promise
    photoCaptureOptions = options

    let connection = photoOutput.connection(with: .video)
    let orientation = responsiveWhenOrientationLocked ? physicalOrientation : UIDevice.current.orientation
    connection?.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)

    // options.mirror is deprecated but should continue to work until removed
    connection?.isVideoMirrored = presetCamera == .front && (mirror || options.mirror)
    var photoSettings = AVCapturePhotoSettings()

    if photoOutput.availablePhotoCodecTypes.contains(AVVideoCodecType.hevc) {
      photoSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.hevc])
    }

    let requestedFlashMode = flashMode.toDeviceFlashMode()
    if photoOutput.supportedFlashModes.contains(requestedFlashMode) {
      photoSettings.flashMode = requestedFlashMode
    }

    if #available(iOS 16.0, *) {
      photoSettings.maxPhotoDimensions = photoOutput.maxPhotoDimensions
    }

    if !photoSettings.availablePreviewPhotoPixelFormatTypes.isEmpty,
    let previewFormat = photoSettings.__availablePreviewPhotoPixelFormatTypes.first {
      photoSettings.previewPhotoFormat = [kCVPixelBufferPixelFormatTypeKey as String: previewFormat]
    }

    if photoOutput.isHighResolutionCaptureEnabled {
      photoSettings.isHighResolutionPhotoEnabled = true
    }

    photoSettings.photoQualityPrioritization = .balanced

    photoOutput.capturePhoto(with: photoSettings, delegate: self)
  }

  public func photoOutput(_ output: AVCapturePhotoOutput, willCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    if photoCaptureOptions?.shutterSound == false {
      AudioServicesDisposeSystemSoundID(1108)
    }

    guard animateShutter else {
      return
    }
    Task { @MainActor in
      self.layer.opacity = 0
      UIView.animate(withDuration: 0.25) {
        self.layer.opacity = 1
      }
    }
  }

  public func photoOutput(
    _ output: AVCapturePhotoOutput,
    didFinishProcessingPhoto photo: AVCapturePhoto,
    error: Error?
    ) {
    guard let promise = photoCapturedPromise, let options = photoCaptureOptions else {
      return
    }

    photoCapturedPromise = nil
    photoCaptureOptions = nil

    if error != nil {
      promise.reject(CameraImageCaptureException())
      return
    }

    let imageData = photo.fileDataRepresentation()
    handleCapturedImageData(
      imageData: imageData,
      metadata: photo.metadata,
      options: options,
      promise: promise
    )
  }

  func handleCapturedImageData(
    imageData: Data?,
    metadata: [String: Any],
    options: TakePictureOptions,
    promise: Promise
  ) {
    guard let imageData, var takenImage = UIImage(data: imageData) else {
      return
    }

    if options.fastMode {
      promise.resolve()
    }

    let previewSize: CGSize = {
      return deviceOrientation == .portrait ?
      CGSize(width: previewLayer.frame.size.height, height: previewLayer.frame.size.width) :
      CGSize(width: previewLayer.frame.size.width, height: previewLayer.frame.size.height)
    }()

    guard let takenCgImage = takenImage.cgImage else {
      return
    }

    let cropRect = CGRect(x: 0, y: 0, width: takenCgImage.width, height: takenCgImage.height)
    let croppedSize = AVMakeRect(aspectRatio: previewSize, insideRect: cropRect)

    takenImage = ExpoCameraUtils.crop(image: takenImage, to: croppedSize)

    let path = FileSystemUtilities.generatePathInCache(
      appContext,
      in: "Camera",
      extension: ".jpg"
    )

    let width = takenImage.size.width
    let height = takenImage.size.height
    var processedImageData: Data?

    var response = [String: Any]()

    if options.exif {
      guard let exifDict = metadata[kCGImagePropertyExifDictionary as String] as? NSDictionary else {
        return
      }
      let updatedExif = ExpoCameraUtils.updateExif(
        metadata: exifDict,
        with: ["Orientation": ExpoCameraUtils.toExifOrientation(orientation: takenImage.imageOrientation)]
      )

      updatedExif[kCGImagePropertyExifPixelYDimension] = width
      updatedExif[kCGImagePropertyExifPixelXDimension] = height
      response["exif"] = updatedExif

      var updatedMetadata = metadata

      if let additionalExif = options.additionalExif {
        updatedExif.addEntries(from: additionalExif)
        var gpsDict = [String: Any]()

        if let latitude = additionalExif["GPSLatitude"] as? Double {
          gpsDict[kCGImagePropertyGPSLatitude as String] = abs(latitude)
          gpsDict[kCGImagePropertyGPSLatitudeRef as String] = latitude >= 0 ? "N" : "S"
        }

        if let longitude = additionalExif["GPSLongitude"] as? Double {
          gpsDict[kCGImagePropertyGPSLongitude as String] = abs(longitude)
          gpsDict[kCGImagePropertyGPSLongitudeRef as String] = longitude >= 0 ? "E" : "W"
        }

        if let altitude = additionalExif["GPSAltitude"] as? Double {
          gpsDict[kCGImagePropertyGPSAltitude as String] = abs(altitude)
          gpsDict[kCGImagePropertyGPSAltitudeRef as String] = altitude >= 0 ? 0 : 1
        }

        if updatedMetadata[kCGImagePropertyGPSDictionary as String] == nil {
          updatedMetadata[kCGImagePropertyGPSDictionary as String] = gpsDict
        } else if var existingGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any] {
          existingGpsDict.merge(gpsDict) { _, new in
            new
          }
          updatedMetadata[kCGImagePropertyGPSDictionary as String] = existingGpsDict
        }
      }

      updatedMetadata[kCGImagePropertyExifDictionary as String] = updatedExif
      processedImageData = ExpoCameraUtils.data(
        from: takenImage,
        with: updatedMetadata,
        quality: Float(options.quality))
    } else {
      processedImageData = takenImage.jpegData(compressionQuality: options.quality)
    }

    guard let processedImageData else {
      promise.reject(CameraSavingImageException())
      return
    }

    response["uri"] = ExpoCameraUtils.write(data: processedImageData, to: path)
    response["width"] = width
    response["height"] = height

    if options.base64 {
      response["base64"] = processedImageData.base64EncodedString()
    }

    if options.fastMode {
      onPictureSaved(["data": response, "id": options.id])
    } else {
      promise.resolve(response)
    }
  }

  func record(options: CameraRecordingOptions, promise: Promise) async {
    if let videoFileOutput, !videoFileOutput.isRecording && videoRecordedPromise == nil {
      if let connection = videoFileOutput.connection(with: .video) {
        let orientation = responsiveWhenOrientationLocked ? physicalOrientation : UIDevice.current.orientation
        connection.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)
        await setVideoOptions(options: options, for: connection, promise: promise)

        if connection.isVideoOrientationSupported && mirror {
          connection.isVideoMirrored = mirror
        }
      }

      if !isValidVideoOptions {
        return
      }

      let path = FileSystemUtilities.generatePathInCache(appContext, in: "Camera", extension: ".mov")
      let fileUrl = URL(fileURLWithPath: path)
      videoRecordedPromise = promise

      videoFileOutput.startRecording(to: fileUrl, recordingDelegate: self)
    }
  }

  func setVideoOptions(options: CameraRecordingOptions, for connection: AVCaptureConnection, promise: Promise) async {
    self.isValidVideoOptions = true

    guard let videoFileOutput else {
      return
    }

    if let maxDuration = options.maxDuration {
      videoFileOutput.maxRecordedDuration = CMTime(seconds: maxDuration, preferredTimescale: 1000)
    }

    if let maxFileSize = options.maxFileSize {
      videoFileOutput.maxRecordedFileSize = Int64(maxFileSize)
    }

    if let codec = options.codec {
      let codecType = codec.codecType()
      if videoFileOutput.availableVideoCodecTypes.contains(codecType) {
        var outputSettings: [String: Any] = [AVVideoCodecKey: codecType]
        if let videoBitrate {
          outputSettings[AVVideoCompressionPropertiesKey] = [AVVideoAverageBitRateKey: videoBitrate]
        }
        videoFileOutput.setOutputSettings(outputSettings, for: connection)
        self.videoCodecType = codecType
      } else {
        promise.reject(CameraRecordingException(options.codec?.rawValue))
        cleanupMovieFileCapture()
        videoRecordedPromise = nil
        isValidVideoOptions = false
      }
    }
  }

  func updateSessionAudioIsMuted() {
    session.beginConfiguration()
    defer { session.commitConfiguration() }

    if isMuted {
      for input in session.inputs {
        if let deviceInput = input as? AVCaptureDeviceInput {
          if deviceInput.device.hasMediaType(.audio) {
            session.removeInput(input)
            return
          }
        }
      }
    }

    if !isMuted && mode == .video {
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

  public override func layoutSubviews() {
    super.layoutSubviews()
    self.backgroundColor = .black
    previewLayer.frame = self.bounds
    self.layer.insertSublayer(previewLayer, at: 0)
  }

  public override func removeFromSuperview() {
    super.removeFromSuperview()
    sessionQueue.async {
      self.stopSession()
    }
    lifecycleManager?.unregisterAppLifecycleListener(self)
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
  }

  func updateCameraIsActive() {
    sessionQueue.async {
      if self.active {
        if !self.session.isRunning {
          self.session.startRunning()
        }
      } else {
        self.session.stopRunning()
      }
    }
  }

  public func fileOutput(
    _ output: AVCaptureFileOutput,
    didFinishRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection],
    error: Error?
  ) {
    var success = true

    if error != nil {
      let value = (error as? NSError)?.userInfo[AVErrorRecordingSuccessfullyFinishedKey] as? Bool
      success = value == true ? true : false
    }

    if success && videoRecordedPromise != nil {
      videoRecordedPromise?.resolve(["uri": outputFileURL.absoluteString])
    } else if videoRecordedPromise != nil {
      videoRecordedPromise?.reject(CameraRecordingFailedException())
    }

    videoRecordedPromise = nil
    videoCodecType = nil
  }

  func stopRecording() {
    videoFileOutput?.stopRecording()
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

  func initializeCaptureSessionInput() {
    sessionQueue.async {
      self.updateDevice()
      self.startSession()
    }
  }

  private func stopSession() {
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
    barcodeScanner?.stopBarcodeScanning()
    session.commitConfiguration()

    motionManager.stopAccelerometerUpdates()
    if session.isRunning {
      session.stopRunning()
    }
#endif
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
    if let photoCapturedPromise {
      photoCapturedPromise.reject(CameraUnmountedException())
    }
  }
}
