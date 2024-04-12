import UIKit
import ExpoModulesCore
import CoreMotion

public class CameraViewNext: ExpoView, EXCameraInterface, EXAppLifecycleListener,
  AVCaptureFileOutputRecordingDelegate, AVCapturePhotoCaptureDelegate {
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
  private var photoCaptureOptions: TakePictureOptionsNext?
  private var videoStabilizationMode: AVCaptureVideoStabilizationMode?
  private var errorNotification: NSObjectProtocol?
  private var physicalOrientation: UIDeviceOrientation = .unknown
  private var motionManager: CMMotionManager = {
    let mm = CMMotionManager()
    mm.accelerometerUpdateInterval = 0.2
    mm.gyroUpdateInterval = 0.2
    return mm
  }()

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

  var flashMode = CameraFlashModeNext.auto

  var torchEnabled = false {
    didSet {
      enableTorch()
    }
  }

  var mode = CameraModeNext.picture {
    didSet {
      setCameraMode()
    }
  }

  var isMuted = false {
    didSet {
      updateSessionAudioIsMuted()
    }
  }

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
    initializeCaptureSessionInput()
    startSession()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(orientationChanged(notification:)),
      name: UIDevice.orientationDidChangeNotification,
      object: nil)
    lifecycleManager?.register(self)
  }

  private func setupPreview() {
    previewLayer.videoPreviewLayer.session = session
    previewLayer.videoPreviewLayer.videoGravity = .resizeAspectFill
    previewLayer.videoPreviewLayer.needsDisplayOnBoundsChange = true
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
    if !session.isRunning {
      sessionQueue.async {
        self.session.startRunning()
      }
    }
  }

  public func onAppBackgrounded() {
    if session.isRunning {
      sessionQueue.async {
        self.session.stopRunning()
      }
    }
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
      return
    }
  }

  private func setCameraMode() {
    sessionQueue.async {
      if self.mode == .video {
        if self.videoFileOutput == nil {
          self.setupMovieFileCapture()
          self.updateSessionAudioIsMuted()
        }
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
      self.session.beginConfiguration()

      let photoOutput = AVCapturePhotoOutput()
      if self.session.canAddOutput(photoOutput) {
        self.session.addOutput(photoOutput)
        photoOutput.isLivePhotoCaptureEnabled = false
        self.photoOutput = photoOutput
      }

      self.addErrorNotification()
      self.changePreviewOrientation()
      self.updateSessionAudioIsMuted()
      self.session.commitConfiguration()

      // Delay starting the scanner
      self.sessionQueue.asyncAfter(deadline: .now() + 0.5) {
        self.barcodeScanner.maybeStartBarcodeScanning()
        self.session.startRunning()
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
        if !self.session.isRunning {
          self.session.startRunning()
          self.updateSessionAudioIsMuted()
          self.onCameraReady()
        }
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
          default: physicalOrientation)
        if deviceOrientation != self.physicalOrientation {
          self.physicalOrientation = deviceOrientation
          onResponsiveOrientationChanged(["orientation": ExpoCameraUtilsNext.toOrientationString(orientation: deviceOrientation)])
        }
      }
    } else {
      motionManager.stopAccelerometerUpdates()
    }
  }

  func takePicture(options: TakePictureOptionsNext, promise: Promise) {
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
      case .on:
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
    options: TakePictureOptionsNext,
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
          if let metadataGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? NSMutableDictionary {
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

  func record(options: CameraRecordingOptionsNext, promise: Promise) {
    sessionQueue.async {
      if let videoFileOutput = self.videoFileOutput, !videoFileOutput.isRecording && self.videoRecordedPromise == nil {
        if let connection = videoFileOutput.connection(with: .video) {
          if !connection.isVideoStabilizationSupported {
            log.warn("\(#function): Video Stabilization is not supported on this device.")
          } else {
            if let videoStabilizationMode = self.videoStabilizationMode {
              connection.preferredVideoStabilizationMode = videoStabilizationMode
            }
          }

          let orientation = self.responsiveWhenOrientationLocked ? self.physicalOrientation : UIDevice.current.orientation
          connection.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)
          self.setVideoOptions(options: options, for: connection, promise: promise)

          if connection.isVideoOrientationSupported && options.mirror {
            connection.isVideoMirrored = options.mirror
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

  func setVideoOptions(options: CameraRecordingOptionsNext, for connection: AVCaptureConnection, promise: Promise) {
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
      for input in self.session.inputs {
        if let deviceInput = input as? AVCaptureDeviceInput {
          if deviceInput.device.hasMediaType(.audio) {
            if self.isMuted {
              self.session.removeInput(input)
            }
            return
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
    super.removeFromSuperview()
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
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
      self.session.beginConfiguration()
      self.session.sessionPreset = preset
      self.session.commitConfiguration()
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
      self.session.stopRunning()
    }
  }

  @objc func orientationChanged(notification: Notification) {
    changePreviewOrientation()
  }

  func changePreviewOrientation() {
    EXUtilities.performSynchronously {
      // We shouldn't access the device orientation anywhere but on the main thread
      let videoOrientation = ExpoCameraUtils.videoOrientation(for: self.deviceOrientation)
      if (self.previewLayer.videoPreviewLayer.connection?.isVideoOrientationSupported) == true {
        self.previewLayer.videoPreviewLayer.connection?.videoOrientation = videoOrientation
      }
    }
  }

  private func createBarcodeScanner() -> BarcodeScanner {
    let scanner = BarcodeScanner(session: session, sessionQueue: sessionQueue)
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
