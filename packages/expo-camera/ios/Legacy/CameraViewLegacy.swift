import UIKit
import ExpoModulesCore
import CoreMotion

// swiftlint:disable:next type_body_length
public class CameraViewLegacy: ExpoView, EXCameraInterface, EXAppLifecycleListener,
  AVCaptureFileOutputRecordingDelegate, AVCapturePhotoCaptureDelegate {
  public var session = AVCaptureSession()
  public var sessionQueue = DispatchQueue(label: "captureSessionQueue")
  private var motionManager = CMMotionManager()
  private var physicalOrientation: UIDeviceOrientation = .unknown

  // MARK: - Legacy Modules
  private var faceDetector: EXFaceDetectorManagerInterface?
  private var lifecycleManager: EXAppLifecycleService?
  private var barCodeScanner: EXBarCodeScannerInterface?
  private var permissionsManager: EXPermissionsInterface?

  // MARK: - Properties

  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var isSessionRunning = false
  private var isValidVideoOptions = true
  private var videoCodecType: AVVideoCodecType?
  private var photoCaptureOptions: TakePictureOptions?
  private var videoStabilizationMode: AVCaptureVideoStabilizationMode?
  private var errorNotification: NSObjectProtocol?

  // MARK: Property Observers
  var responsiveWhenOrientationLocked = false {
    didSet {
      updateResponsiveOrientation()
    }
  }

  var pictureSize = AVCaptureSession.Preset.high {
    didSet {
      updateSessionPreset(preset: pictureSize)
    }
  }

  var isDetectingFaces = false {
    didSet {
      if let faceDetector {
        faceDetector.setIsEnabled(isDetectingFaces)
      } else if isDetectingFaces {
        log.error("FaceDetector module not found. Make sure `expo-face-detector` is installed and linked correctly.")
      }
    }
  }

  var isScanningBarCodes = false {
    didSet {
      if let barCodeScanner {
        barCodeScanner.setIsEnabled(isScanningBarCodes)
      } else if isScanningBarCodes {
        log.error("BarCodeScanner module not found. Make sure "
        + "`expo-barcode-scanner` is installed and linked correctly.")
      }
    }
  }

  var presetCamera = AVCaptureDevice.Position.back {
    didSet {
      updateType()
    }
  }

  var autoFocus = AVCaptureDevice.FocusMode.autoFocus {
    didSet {
      updateFocusMode()
    }
  }

  var whiteBalance = WhiteBalance.auto {
    didSet {
      updateWhiteBalance()
    }
  }

  var flashMode = FlashModeLegacy.auto {
    didSet {
      updateFlashMode()
    }
  }

  var zoom: CGFloat = 0 {
    didSet {
      updateZoom()
    }
  }

  var focusDepth: Float = 0 {
    didSet {
      updateFocusDepth()
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
  let onBarCodeScanned = EventDispatcher()
  let onFacesDetected = EventDispatcher()
  let onResponsiveOrientationChanged = EventDispatcher()

  private var deviceOrientation: UIInterfaceOrientation {
    window?.windowScene?.interfaceOrientation ?? .unknown
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    faceDetector = createFaceDetectorManager()
    barCodeScanner = createBarCodeScanner()
    lifecycleManager = appContext?.legacyModule(implementing: EXAppLifecycleService.self)
    permissionsManager = appContext?.legacyModule(implementing: EXPermissionsInterface.self)
    #if !targetEnvironment(simulator)
    previewLayer = AVCaptureVideoPreviewLayer.init(session: session)
    previewLayer?.videoGravity = .resizeAspectFill
    previewLayer?.needsDisplayOnBoundsChange = true
    barCodeScanner?.setPreviewLayer(previewLayer)
    #endif
    self.initializeCaptureSessionInput()
    self.startSession()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(orientationChanged(notification:)),
      name: UIDevice.orientationDidChangeNotification,
      object: nil)
    lifecycleManager?.register(self)
    motionManager.accelerometerUpdateInterval = 0.2
    motionManager.gyroUpdateInterval = 0.2
  }

  private func updateType() {
    sessionQueue.async {
      self.initializeCaptureSessionInput()
      if !self.session.isRunning {
        self.startSession()
      }
    }
  }

  public func onAppForegrounded() {
    if !session.isRunning && isSessionRunning {
      isSessionRunning = false
      sessionQueue.async {
        self.session.startRunning()
        self.ensureSessionConfiguration()
      }
    }
  }

  public func onAppBackgrounded() {
    if session.isRunning && !isSessionRunning {
      isSessionRunning = true
      sessionQueue.async {
        self.session.stopRunning()
      }
    }
  }

  private func updateFlashMode() {
    guard let device = captureDeviceInput?.device else {
      return
    }

    if flashMode == .torch {
      if !device.hasTorch {
        return
      }

      do {
        try device.lockForConfiguration()
        if device.hasTorch && device.isTorchModeSupported(.on) {
          device.torchMode = .on
        }
      } catch {
        log.info("\(#function): \(error.localizedDescription)")
        return
      }
    } else {
      if !device.hasFlash {
        return
      }

      do {
        try device.lockForConfiguration()
        if device.isTorchModeSupported(.off) {
          device.torchMode = .off
        }
      } catch {
        log.info("\(#function): \(error.localizedDescription)")
        return
      }
    }
    device.unlockForConfiguration()
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
      if self.presetCamera == .unspecified {
        return
      }

      let photoOutput = AVCapturePhotoOutput()
      photoOutput.isLivePhotoCaptureEnabled = false

      if self.session.canAddOutput(photoOutput) {
        self.session.addOutput(photoOutput)
        self.photoOutput = photoOutput
      }

      self.addErrorNotification()
      self.changePreviewOrientation()

      self.sessionQueue.asyncAfter(deadline: .now() + round(50 / 1_000_000)) {
        self.maybeStartFaceDetection(self.presetCamera != .back)
        if let barCodeScanner = self.barCodeScanner {
          barCodeScanner.maybeStartBarCodeScanning()
        }

        self.session.startRunning()
        self.ensureSessionConfiguration()
        self.onCameraReady()
      }
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

  private func updateFocusMode() {
    guard let device = captureDeviceInput?.device else {
      return
    }

    do {
      try device.lockForConfiguration()

      if device.isFocusModeSupported(autoFocus) {
        device.focusMode = autoFocus
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }

    device.unlockForConfiguration()
  }

  private func updateFocusDepth() {
    guard let device = captureDeviceInput?.device, device.focusMode == .locked else {
      return
    }

    if device.isLockingFocusWithCustomLensPositionSupported {
      do {
        try device.lockForConfiguration()
        device.setFocusModeLocked(lensPosition: focusDepth) { _ in
          device.unlockForConfiguration()
        }
      } catch {
        log.info("\(#function): \(error.localizedDescription)")
        return
      }
    }

    log.info("\(#function): Setting focusDepth isn't supported for this camera device")
  }

  func updateWhiteBalance() {
    guard let device = captureDeviceInput?.device else {
      return
    }

    do {
      try device.lockForConfiguration()

      if whiteBalance == WhiteBalance.auto {
        device.whiteBalanceMode = AVCaptureDevice.WhiteBalanceMode.continuousAutoWhiteBalance
        device.unlockForConfiguration()
      } else {
        if device.isLockingWhiteBalanceWithCustomDeviceGainsSupported {
          let rgbGains = device.deviceWhiteBalanceGains(
            for: AVCaptureDevice.WhiteBalanceTemperatureAndTintValues(
              temperature: whiteBalance.temperature(), tint: 0))

          device.setWhiteBalanceModeLocked(with: rgbGains) { _ in
            device.unlockForConfiguration()
          }
        }
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
    }

    device.unlockForConfiguration()
  }

  private func addErrorNotification() {
    if self.errorNotification != nil {
      NotificationCenter.default.removeObserver(self.errorNotification)
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
        if self.isSessionRunning {
          self.session.startRunning()
          self.isSessionRunning = self.session.isRunning
          self.ensureSessionConfiguration()
          self.onCameraReady()
        }
      }
    }
  }

  func setBarCodeScannerSettings(settings: [String: Any]) {
    if let barCodeScanner {
      barCodeScanner.setSettings(settings)
    }
  }

  func updateFaceDetectorSettings(settings: [String: Any]) {
    if let faceDetector {
      faceDetector.updateSettings(settings)
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
          self.onResponsiveOrientationChanged(["orientation": deviceOrientation.rawValue])
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
      let photoSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])

      var requestedFlashMode = AVCaptureDevice.FlashMode.off

      switch self.flashMode {
      case .off:
        requestedFlashMode = .off
      case .auto:
        requestedFlashMode = .auto
      case .on, .torch:
        requestedFlashMode = .on
      }

      if photoOutput.supportedFlashModes.contains(requestedFlashMode) {
        photoSettings.flashMode = requestedFlashMode
      }

      if photoOutput.isHighResolutionCaptureEnabled {
        photoSettings.isHighResolutionPhotoEnabled = true
      }
      photoOutput.capturePhoto(with: photoSettings, delegate: self)
    }
  }

  public func photoOutput(
    _ output: AVCapturePhotoOutput,
    didFinishProcessingRawPhoto rawSampleBuffer: CMSampleBuffer?,
    previewPhoto previewPhotoSampleBuffer: CMSampleBuffer?,
    resolvedSettings: AVCaptureResolvedPhotoSettings,
    bracketSettings: AVCaptureBracketedStillImageSettings?,
    error: Error?
  ) {
    guard let promise = photoCapturedPromise, let options = photoCaptureOptions else {
      return
    }
    photoCapturedPromise = nil
    photoCaptureOptions = nil

    guard let rawSampleBuffer, error != nil else {
      promise.reject(CameraImageCaptureException())
      return
    }

    guard let imageData = AVCapturePhotoOutput.jpegPhotoDataRepresentation(
      forJPEGSampleBuffer: rawSampleBuffer,
      previewPhotoSampleBuffer: previewPhotoSampleBuffer),
      let sourceImage = CGImageSourceCreateWithData(imageData as CFData, nil),
      let metadata = CGImageSourceCopyPropertiesAtIndex(sourceImage, 0, nil) as? [String: Any]
    else {
      promise.reject(CameraMetadataDecodingException())
      return
    }

    self.handleCapturedImageData(imageData: imageData, metadata: metadata, options: options, promise: promise)
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
      CGSize(width: previewLayer?.frame.size.height ?? 0.0, height: previewLayer?.frame.size.width ?? 0.0) :
      CGSize(width: previewLayer?.frame.size.width ?? 0.0, height: previewLayer?.frame.size.height ?? 0.0)
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

    if path.isEmpty {
      return
    }

    let width = takenImage.size.width
    let height = takenImage.size.height
    var processedImageData: Data?

    var response = [String: Any]()

    if options.exif {
      guard let exifDict = metadata[kCGImagePropertyExifDictionary as String] as? NSDictionary else {
        return
      }
      var updatedExif = ExpoCameraUtils.updateExif(
        metadata: exifDict,
        with: ["Orientation": ExpoCameraUtils.export(orientation: takenImage.imageOrientation)]
      )

      updatedExif[kCGImagePropertyExifPixelYDimension] = width
      updatedExif[kCGImagePropertyExifPixelXDimension] = height
      response["exif"] = updatedExif

      var updatedMetadata = metadata

      if let additionalExif = options.additionalExif {
        updatedExif.addEntries(from: additionalExif)
        var gpsDict = [String: Any]()

        let gpsLatitude = additionalExif["GPSLatitude"] as? Double
        if let latitude = gpsLatitude {
          gpsDict[kCGImagePropertyGPSLatitude as String] = abs(latitude)
          gpsDict[kCGImagePropertyGPSLatitudeRef as String] = latitude >= 0 ? "N" : "S"
        }

        let gpsLongitude = additionalExif["GPSLongitude"] as? Double
        if let longitude = gpsLongitude {
          gpsDict[kCGImagePropertyGPSLongitude as String] = abs(longitude)
          gpsDict[kCGImagePropertyGPSLongitudeRef as String] = longitude >= 0 ? "E" : "W"
        }

        let gpsAltitude = additionalExif["GPSAltitude"] as? Double
        if let altitude = gpsAltitude {
          gpsDict[kCGImagePropertyGPSAltitude as String] = abs(altitude)
          gpsDict[kCGImagePropertyGPSAltitudeRef as String] = altitude >= 0 ? 0 : 1
        }

        let metadataGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any]
        if updatedMetadata[kCGImagePropertyGPSDictionary as String] == nil {
          updatedMetadata[kCGImagePropertyGPSDictionary as String] = gpsDict
        } else {
          if var metadataGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? NSMutableDictionary {
            metadataGpsDict.addEntries(from: gpsDict)
          }
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

  func record(options: CameraRecordingOptionsLegacy, promise: Promise) {
    if videoFileOutput == nil {
      if let faceDetector {
        faceDetector.stopFaceDetection()
      }
      setupMovieFileCapture()
    }

    if let videoFileOutput, !videoFileOutput.isRecording && videoRecordedPromise == nil {
      updateSessionAudioIsMuted(options.mute)

      if let connection = videoFileOutput.connection(with: .video) {
        if !connection.isVideoStabilizationSupported {
          log.warn("\(#function): Video Stabilization is not supported on this device.")
        } else {
          if let videoStabilizationMode {
            connection.preferredVideoStabilizationMode = videoStabilizationMode
          }
        }

        let orientation = self.responsiveWhenOrientationLocked ? self.physicalOrientation : UIDevice.current.orientation
        connection.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)
        setVideoOptions(options: options, for: connection, promise: promise)

        if connection.isVideoOrientationSupported && options.mirror {
          connection.isVideoMirrored = options.mirror
        }
      }

      let preset = options.quality?.toPreset() ?? .high
      updateSessionPreset(preset: preset)

      if !self.isValidVideoOptions {
        return
      }

      sessionQueue.async {
        let path = FileSystemUtilities.generatePathInCache(self.appContext, in: "Camera", extension: ".mov")
        let fileUrl = URL(fileURLWithPath: path)
        self.videoRecordedPromise = promise

        videoFileOutput.startRecording(to: fileUrl, recordingDelegate: self)
      }
    }
  }

  func setVideoOptions(options: CameraRecordingOptionsLegacy, for connection: AVCaptureConnection, promise: Promise) {
    sessionQueue.async {
      self.isValidVideoOptions = true

      guard let movieFileOutput = self.videoFileOutput else {
        return
      }

      if let maxDuration = options.maxDuration {
        self.videoFileOutput?.maxRecordedDuration = CMTime(seconds: maxDuration, preferredTimescale: 30)
      }

      if let maxFileSize = options.maxFileSize {
        self.videoFileOutput?.maxRecordedFileSize = Int64(maxFileSize)
      }

      if let codec = options.codec {
        let codecType = codec.codecType()
        if movieFileOutput.availableVideoCodecTypes.contains(codecType) {
          movieFileOutput.setOutputSettings([AVVideoCodecKey: codecType], for: connection)
          self.videoCodecType = codecType
        } else {
          promise.reject(CameraRecordingException(self.videoCodecType?.rawValue))

          self.cleanupMovieFileCapture()
          self.videoRecordedPromise = nil
          self.isValidVideoOptions = false
        }
      }
    }
  }

  func updateSessionAudioIsMuted(_ isMuted: Bool) {
    sessionQueue.async {
      self.session.beginConfiguration()

      for input in self.session.inputs {
        if let deviceInput = input as? AVCaptureDeviceInput {
          if deviceInput.device.hasMediaType(.audio) {
            if isMuted {
              self.session.removeInput(input)
            }
            return
          }
        }
      }

      if !isMuted {
        if let audioCapturedevice = AVCaptureDevice.default(for: .audio) {
          do {
            let audioDeviceInput = try AVCaptureDeviceInput(device: audioCapturedevice)

            if self.session.canAddInput(audioDeviceInput) {
              self.session.addInput(audioDeviceInput)
            }
          } catch {
            log.info("\(#function): \(error.localizedDescription)")
            self.session.commitConfiguration()
            return
          }
        }
      }

      self.session.commitConfiguration()
    }
  }

  func setupMovieFileCapture() {
    let output = AVCaptureMovieFileOutput()
    if self.session.canAddOutput(output) {
      self.session.addOutput(output)
      self.videoFileOutput = output
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
    previewLayer?.frame = self.bounds
    self.backgroundColor = .black
    if let previewLayer {
      self.layer.insertSublayer(previewLayer, at: 0)
    }
  }

  public override func removeFromSuperview() {
    lifecycleManager?.unregisterAppLifecycleListener(self)
    self.stopSession()
    super.removeFromSuperview()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
  }

  func ensureSessionConfiguration() {
    sessionQueue.async {
      self.updateFlashMode()
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

    cleanupMovieFileCapture()
    maybeStartFaceDetection(false)

    if session.sessionPreset != pictureSize {
      updateSessionPreset(preset: pictureSize)
    }
  }

  func maybeStartFaceDetection(_ mirrored: Bool) {
    guard let faceDetector else {
      return
    }
    let connection = photoOutput?.connection(with: .video)
    connection?.videoOrientation = ExpoCameraUtils.videoOrientation(for: UIDevice.current.orientation)
    faceDetector.maybeStartFaceDetection(on: session, with: previewLayer, mirrored: mirrored)
  }

  func setPresetCamera(presetCamera: AVCaptureDevice.Position) {
    self.presetCamera = presetCamera
    faceDetector?.updateMirrored(presetCamera != .back)
  }

  func stopRecording() {
    videoFileOutput?.stopRecording()
  }

  func resumePreview() {
    previewLayer?.connection?.isEnabled = true
  }

  func pausePreview() {
    previewLayer?.connection?.isEnabled = false
  }

  func updateSessionPreset(preset: AVCaptureSession.Preset) {
    #if !targetEnvironment(simulator)
    sessionQueue.async {
      self.session.beginConfiguration()
      if self.session.canSetSessionPreset(preset) {
        self.session.sessionPreset = preset
      }
      self.session.commitConfiguration()
    }
    #endif
  }

  func initializeCaptureSessionInput() {
    if captureDeviceInput?.device.position == presetCamera {
      return
    }

    EXUtilities.performSynchronously {
      var orientation: AVCaptureVideoOrientation = .portrait
      if self.deviceOrientation != .unknown {
        if let videoOrientation = AVCaptureVideoOrientation(rawValue: self.deviceOrientation.rawValue) {
          orientation = videoOrientation
        }
      }
      self.previewLayer?.connection?.videoOrientation = orientation
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
          self.updateFocusMode()
          self.updateFocusDepth()
          self.updateWhiteBalance()
        }
      } catch {
        self.onMountError(["message": "Camera could not be started - \(error.localizedDescription)"])
      }
      self.session.commitConfiguration()
    }
  }

  private func stopSession() {
    #if targetEnvironment(simulator)
    return
    #endif
    sessionQueue.async {
      if let faceDetector = self.faceDetector {
        faceDetector.stopFaceDetection()
      }
      if let barCodeScanner = self.barCodeScanner {
        barCodeScanner.stopBarCodeScanning()
      }

      self.session.beginConfiguration()
      self.motionManager.stopAccelerometerUpdates()
      self.previewLayer?.removeFromSuperlayer()

      for input in self.session.inputs {
        self.session.removeInput(input)
      }

      for output in self.session.outputs {
        self.session.removeOutput(output)
      }
      self.session.commitConfiguration()
      self.session.stopRunning()
    }
  }

  @objc func orientationChanged(notification: Notification) {
    changePreviewOrientation()
  }

  func changePreviewOrientation() {
    EXUtilities.performSynchronously {
      let videoOrientation = ExpoCameraUtils.videoOrientation(for: self.deviceOrientation)
      if (self.previewLayer?.connection?.isVideoOrientationSupported) == true {
        self.previewLayer?.connection?.videoOrientation = videoOrientation
      }
    }
  }

  private func createFaceDetectorManager() -> EXFaceDetectorManagerInterface? {
    let provider: EXFaceDetectorManagerProviderInterface? =
      appContext?.legacyModule(implementing: EXFaceDetectorManagerProviderInterface.self)

    guard let faceDetector = provider?.createFaceDetectorManager() else {
      return nil
    }

    faceDetector.setOnFacesDetected { [weak self] faces in
      guard let self else {
        return
      }
      self.onFacesDetected([
        "type": "face",
        "faces": faces
      ])
    }

    faceDetector.setSessionQueue(sessionQueue)
    return faceDetector
  }

  private func createBarCodeScanner() -> EXBarCodeScannerInterface? {
    guard let barCodeScnnerProvider: EXBarCodeScannerProviderInterface? =
      appContext?.legacyModule(implementing: EXBarCodeScannerProviderInterface.self) else {
      return nil
    }

    guard let scanner = barCodeScnnerProvider?.createBarCodeScanner() else {
      return nil
    }

    scanner.setSession(session)
    scanner.setSessionQueue(sessionQueue)
    scanner.setOnBarCodeScanned { [weak self] body in
      if let body = body as? [String: Any] {
        self?.onBarCodeScanned(body)
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
