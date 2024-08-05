import UIKit
import ExpoModulesCore
import CoreMotion

public class CameraView: ExpoView, EXCameraInterface, EXAppLifecycleListener,
  AVCaptureFileOutputRecordingDelegate, AVCapturePhotoCaptureDelegate, CameraEvent {
  public var session = AVCaptureSession()
  public var sessionQueue = DispatchQueue(label: "captureSessionQueue")

  // MARK: - Legacy Modules

  private var lifecycleManager: EXAppLifecycleService?
  private var permissionsManager: EXPermissionsInterface?

  // MARK: - Properties

  private lazy var barcodeScanner = createBarcodeScanner()
  private var previewLayer = PreviewView()
  private var isValidVideoOptions = true
  private var videoCodecType: AVVideoCodecType?
  private var photoCaptureOptions: TakePictureOptions?
  private var errorNotification: NSObjectProtocol?
  private var physicalOrientation: UIDeviceOrientation = .unknown
  private var motionManager: CMMotionManager = {
    let mm = CMMotionManager()
    mm.accelerometerUpdateInterval = 0.2
    mm.gyroUpdateInterval = 0.2
    return mm
  }()
  private var cameraShouldInit = true
  private var isSessionPaused = false

  // MARK: Property Observers

  var responsiveWhenOrientationLocked = false {
    didSet {
      updateResponsiveOrientation()
    }
  }

  var videoQuality: VideoQuality = .video1080p {
    didSet {
      if self.session.sessionPreset != videoQuality.toPreset() {
        self.sessionQueue.async {
          self.updateSessionPreset(preset: self.videoQuality.toPreset())
        }
      }
    }
  }

  var isScanningBarcodes = false {
    didSet {
      barcodeScanner.setIsEnabled(isScanningBarcodes)
    }
  }

  var presetCamera = AVCaptureDevice.Position.back {
    didSet {
      updateType()
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
      setCameraMode()
    }
  }

  var isMuted = false {
    didSet {
      updateSessionAudioIsMuted()
    }
  }

  var active = true {
    didSet {
      updateCameraIsActive()
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
    window?.windowScene?.interfaceOrientation ?? .unknown
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    lifecycleManager = appContext?.legacyModule(implementing: EXAppLifecycleService.self)
    permissionsManager = appContext?.legacyModule(implementing: EXPermissionsInterface.self)
    #if !targetEnvironment(simulator)
    setupPreview()
    #endif
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(orientationChanged(notification:)),
      name: UIDevice.orientationDidChangeNotification,
      object: nil)
    lifecycleManager?.register(self)
  }

  private func setupPreview() {
    DispatchQueue.main.async {
      self.previewLayer.videoPreviewLayer.session = self.session
      self.previewLayer.videoPreviewLayer.videoGravity = .resizeAspectFill
      self.previewLayer.videoPreviewLayer.needsDisplayOnBoundsChange = true
      self.addSubview(self.previewLayer)
    }
  }

  func initCamera() {
    guard cameraShouldInit else {
      return
    }
    cameraShouldInit = false
    self.initializeCaptureSessionInput()
  }

  private func updateType() {
    cameraShouldInit = true
  }

  public func onAppForegrounded() {
    if !session.isRunning && isSessionPaused {
      isSessionPaused = false
      sessionQueue.async {
        self.session.startRunning()
        self.enableTorch()
      }
    }
  }

  public func onAppBackgrounded() {
    if session.isRunning && !isSessionPaused {
      isSessionPaused = true
      sessionQueue.async {
        self.session.stopRunning()
      }
    }
  }

  private func updatePictureSize() {
#if !targetEnvironment(simulator)
    sessionQueue.async {
      self.session.beginConfiguration()
      let preset = self.pictureSize.toCapturePreset()
      if self.session.canSetSessionPreset(preset) {
        self.session.sessionPreset = preset
      }
      self.session.commitConfiguration()
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
    sessionQueue.async {
      if self.mode == .video {
        if self.videoFileOutput == nil {
          self.setupMovieFileCapture()
        }
        self.updateSessionAudioIsMuted()
      } else {
        self.cleanupMovieFileCapture()
      }
    }
  }

  private func startSession() {
    #if targetEnvironment(simulator)
    return
    #endif
    guard let manager = permissionsManager else {
      log.info("Permissions module not found.")
      return
    }
    if !manager.hasGrantedPermission(usingRequesterClass: CameraOnlyPermissionRequester.self) {
      onMountError(["message": "Camera permissions not granted - component could not be rendered."])
      return
    }

    sessionQueue.async {
      let photoOutput = AVCapturePhotoOutput()
      photoOutput.isLivePhotoCaptureEnabled = false
      if self.session.canAddOutput(photoOutput) {
        self.session.addOutput(photoOutput)
        self.photoOutput = photoOutput
      }

      self.session.sessionPreset = self.mode == .video ? self.pictureSize.toCapturePreset() : .photo
      self.addErrorNotification()
      self.changePreviewOrientation()
    }

    // Delay starting the scanner
    sessionQueue.asyncAfter(deadline: .now() + 0.5) {
      self.barcodeScanner.maybeStartBarcodeScanning()
      self.session.startRunning()
      self.onCameraReady()
      self.enableTorch()
    }
  }

  private func updateZoom() {
    guard let device = captureDeviceInput?.device else {
      return
    }

    do {
      try device.lockForConfiguration()
      device.videoZoomFactor = (device.activeFormat.videoMaxZoomFactor - 1.0) * zoom + 1.0
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }

    device.unlockForConfiguration()
  }

  private func addErrorNotification() {
    if self.errorNotification != nil {
      NotificationCenter.default.removeObserver(self.errorNotification as Any)
    }

    self.errorNotification = NotificationCenter.default.addObserver(
      forName: .AVCaptureSessionRuntimeError,
      object: self.session,
      queue: nil) { [weak self] notification in
      guard let self else {
        return
      }
      guard let error = notification.userInfo?[AVCaptureSessionErrorKey] as? AVError else {
        return
      }

      if error.code == .mediaServicesWereReset {
        self.session.startRunning()
        self.updateSessionAudioIsMuted()
        self.onCameraReady()
      }
    }
  }

  func setBarcodeScannerSettings(settings: BarcodeSettings) {
    barcodeScanner.setSettings([BARCODE_TYPES_KEY: settings.toMetadataObjectType()])
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

  func takePicture(options: TakePictureOptions, promise: Promise) {
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

    sessionQueue.async {
      let connection = photoOutput.connection(with: .video)
      let orientation = self.responsiveWhenOrientationLocked ? self.physicalOrientation : UIDevice.current.orientation
      connection?.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)

      // options.mirror is deprecated but should continue to work until removed
      connection?.isVideoMirrored = self.presetCamera == .front && (self.mirror || options.mirror)
      var photoSettings = AVCapturePhotoSettings()

      if photoOutput.availablePhotoCodecTypes.contains(AVVideoCodecType.hevc) {
        photoSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
      }

      var requestedFlashMode = self.flashMode.toDeviceFlashMode()
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
  }

  public func photoOutput(_ output: AVCapturePhotoOutput, willCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    guard animateShutter else {
      return
    }
    DispatchQueue.main.async {
      self.previewLayer.videoPreviewLayer.opacity = 0
      UIView.animate(withDuration: 0.25) {
        self.previewLayer.videoPreviewLayer.opacity = 1
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

  func record(options: CameraRecordingOptions, promise: Promise) {
    sessionQueue.async {
      let preset = options.quality?.toPreset()
      if let preset {
        self.updateSessionPreset(preset: preset)
      }
    }

    sessionQueue.async {
      if let videoFileOutput = self.videoFileOutput, !videoFileOutput.isRecording && self.videoRecordedPromise == nil {
        if let connection = videoFileOutput.connection(with: .video) {
          if connection.isVideoStabilizationSupported {
            connection.preferredVideoStabilizationMode = .auto
          } else {
            log.warn("\(#function): Video Stabilization is not supported on this device.")
          }

          let orientation = self.responsiveWhenOrientationLocked ? self.physicalOrientation : UIDevice.current.orientation
          connection.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)
          self.setVideoOptions(options: options, for: connection, promise: promise)

          if connection.isVideoOrientationSupported && self.mirror {
            connection.isVideoMirrored = self.mirror
          }
        }

        if !self.isValidVideoOptions {
          return
        }

        let path = FileSystemUtilities.generatePathInCache(self.appContext, in: "Camera", extension: ".mov")
        let fileUrl = URL(fileURLWithPath: path)
        self.videoRecordedPromise = promise

        videoFileOutput.startRecording(to: fileUrl, recordingDelegate: self)
      }
    }
  }

  func setVideoOptions(options: CameraRecordingOptions, for connection: AVCaptureConnection, promise: Promise) {
    self.isValidVideoOptions = true

    guard let videoFileOutput = self.videoFileOutput else {
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
        videoFileOutput.setOutputSettings([AVVideoCodecKey: codecType], for: connection)
        self.videoCodecType = codecType
      } else {
        promise.reject(CameraRecordingException(self.videoCodecType?.rawValue))

        self.cleanupMovieFileCapture()
        self.videoRecordedPromise = nil
        self.isValidVideoOptions = false
      }
    }
  }

  // Must be called on the sessionQueue
  func updateSessionAudioIsMuted() {
    sessionQueue.async {
      self.session.beginConfiguration()
      if self.isMuted {
        for input in self.session.inputs {
          if let deviceInput = input as? AVCaptureDeviceInput {
            if deviceInput.device.hasMediaType(.audio) {
              self.session.removeInput(input)
              return
            }
          }
        }
      }

      if !self.isMuted && self.mode == .video {
        if let audioCapturedevice = AVCaptureDevice.default(for: .audio) {
          do {
            let audioDeviceInput = try AVCaptureDeviceInput(device: audioCapturedevice)
            if self.session.canAddInput(audioDeviceInput) {
              self.session.addInput(audioDeviceInput)
            }
          } catch {
            log.info("\(#function): \(error.localizedDescription)")
            return
          }
        }
      }
      self.session.commitConfiguration()
    }
  }

  // Must be called on the sessionQueue
  func setupMovieFileCapture() {
    let output = AVCaptureMovieFileOutput()
    if self.session.canAddOutput(output) {
      self.session.beginConfiguration()
      self.session.addOutput(output)
      self.videoFileOutput = output
      self.session.commitConfiguration()
    }
  }

  // Must be called on the sessionQueue
  func cleanupMovieFileCapture() {
    if let videoFileOutput {
      if session.outputs.contains(videoFileOutput) {
        self.session.beginConfiguration()
        session.removeOutput(videoFileOutput)
        self.videoFileOutput = nil
        self.session.commitConfiguration()
      }
    }
  }

  public override func layoutSubviews() {
    previewLayer.videoPreviewLayer.frame = self.bounds
    self.backgroundColor = .black
    self.layer.insertSublayer(previewLayer.videoPreviewLayer, at: 0)
  }

  public override func removeFromSuperview() {
    lifecycleManager?.unregisterAppLifecycleListener(self)
    self.stopSession()
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
    super.removeFromSuperview()
  }

  func updateCameraIsActive() {
    if self.session.isRunning == active {
      return
    }
    sessionQueue.async {
      if self.active {
        self.session.startRunning()
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

  func setPresetCamera(presetCamera: AVCaptureDevice.Position) {
    self.presetCamera = presetCamera
  }

  func stopRecording() {
    sessionQueue.async {
      self.videoFileOutput?.stopRecording()
    }
  }

  // Must be called on the sessionQueue
  func updateSessionPreset(preset: AVCaptureSession.Preset) {
#if !targetEnvironment(simulator)
    if self.session.canSetSessionPreset(preset) {
      if self.session.sessionPreset != preset {
        self.session.beginConfiguration()
        self.session.sessionPreset = preset
        self.session.commitConfiguration()
      }
    }
#endif
  }

  func initializeCaptureSessionInput() {
    if captureDeviceInput?.device.position == presetCamera {
      return
    }

    sessionQueue.async {
      self.session.beginConfiguration()

      guard let device = ExpoCameraUtils.device(with: .video, preferring: self.presetCamera) else {
        return
      }

      if let videoCaptureDeviceInput = self.captureDeviceInput {
        self.session.removeInput(videoCaptureDeviceInput)
      }

      do {
        let captureDeviceInput = try AVCaptureDeviceInput(device: device)

        if self.session.canAddInput(captureDeviceInput) {
          self.session.addInput(captureDeviceInput)
          self.captureDeviceInput = captureDeviceInput
          self.updateZoom()
        }
      } catch {
        self.onMountError(["message": "Camera could not be started - \(error.localizedDescription)"])
      }
      self.session.commitConfiguration()
      self.startSession()
    }
  }

  private func stopSession() {
    #if targetEnvironment(simulator)
    return
    #endif
    self.previewLayer.videoPreviewLayer.removeFromSuperlayer()

    sessionQueue.async {
      self.session.beginConfiguration()
      for input in self.session.inputs {
        self.session.removeInput(input)
      }

      for output in self.session.outputs {
        self.session.removeOutput(output)
      }
      self.barcodeScanner.stopBarcodeScanning()
      self.session.commitConfiguration()

      self.motionManager.stopAccelerometerUpdates()
      if self.session.isRunning {
        self.session.stopRunning()
      }
    }
  }

  func resumePreview() {
    previewLayer.videoPreviewLayer.connection?.isEnabled = true
  }

  func pausePreview() {
    previewLayer.videoPreviewLayer.connection?.isEnabled = false
  }

  @objc func orientationChanged(notification: Notification) {
    changePreviewOrientation()
  }

  func changePreviewOrientation() {
    EXUtilities.performSynchronously {
      // We shouldn't access the device orientation anywhere but on the main thread
      let videoOrientation = ExpoCameraUtils.videoOrientation(for: self.deviceOrientation)
      if (self.previewLayer.videoPreviewLayer.connection?.isVideoOrientationSupported) == true {
        self.physicalOrientation = ExpoCameraUtils.physicalOrientation(for: self.deviceOrientation)
        self.previewLayer.videoPreviewLayer.connection?.videoOrientation = videoOrientation
      }
    }
  }

  private func createBarcodeScanner() -> BarcodeScanner {
    let scanner = BarcodeScanner(session: session, sessionQueue: sessionQueue)
    scanner.setPreviewLayer(layer: previewLayer.videoPreviewLayer)
    scanner.onBarcodeScanned = { [weak self] body in
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

    if let errorNotification {
      NotificationCenter.default.removeObserver(errorNotification)
    }
  }
}
