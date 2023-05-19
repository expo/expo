import UIKit
import ExpoModulesCore

class ExpoCamera: ExpoView, EXAppLifecycleListener, EXCameraInterface, AVCaptureFileOutputRecordingDelegate, AVCaptureMetadataOutputObjectsDelegate, AVCapturePhotoCaptureDelegate {
    
  internal var session = AVCaptureSession()
  internal var sessionQueue = DispatchQueue(label: "cameraQueue")
  
  // MARK: Legacy Modules
  private var faceDetector: EXFaceDetectorManagerInterface?
  private var lifecycleManager: EXAppLifecycleService?
  private var barCodeScanner: EXBarCodeScannerInterface?
  private var fileSystem: EXFileSystemInterface?
  private var permissionsManager: EXPermissionsInterface?

  // MARK: Properties
  
  var pictureSize = AVCaptureSession.Preset.high
  var isDetectingFaces = false
  var isScanningBarCodes = false
  var presetCamera = AVCaptureDevice.Position.back
  var zoom: CGFloat = 0.0
  var autoFocus = AVCaptureDevice.FocusMode.locked
  var focusDepth: Float = 0.0
  var whiteBalance = CameraWhiteBalance.auto
  var flashMode = CameraFlashMode.auto
  
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var paused = false
  private var isValidVideoOptions = true
  private var videoCodecType: AVVideoCodecType?
  private var movieFileOutput: AVCaptureMovieFileOutput?
  private var photoOutput: AVCapturePhotoOutput?
  private var videoCaptureDeviceInput: AVCaptureDeviceInput?
  private var photoCaptureOptions: TakePictureOptions?
  private var videoStabilizationMode: AVCaptureVideoStabilizationMode?
  
  // MARK: Callbacks
  
  private var photoCapturedPromise: Promise?
  private var videoRecordedPromise: Promise?
  
  // MARK: Events
  
  let onCameraReady = EventDispatcher()
  let onMountError = EventDispatcher()
  let onPictureSaved = EventDispatcher()
  let onBarCodeScanned = EventDispatcher()
  let onFacesDetected = EventDispatcher()
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    faceDetector = createFaceDetectorManager()
    barCodeScanner = createBarCodeScanner()
    lifecycleManager = appContext?.legacyModule(implementing: EXAppLifecycleService.self)
    fileSystem = appContext?.legacyModule(implementing: EXFileSystemInterface.self)
    permissionsManager = appContext?.legacyModule(implementing: EXPermissionsInterface.self)
#if !targetEnvironment(simulator)
    previewLayer = AVCaptureVideoPreviewLayer.init(session: session)
    previewLayer?.videoGravity = .resizeAspectFill
    previewLayer?.needsDisplayOnBoundsChange = true
#endif
    self.changePreviewOrientation(orientation: UIApplication.shared.statusBarOrientation)
    self.initializeCaptureSessionInput()
    self.startSession()
    NotificationCenter.default.addObserver(self, selector: #selector(orientationChanged(notification:)), name: UIDevice.orientationDidChangeNotification, object: nil)
    lifecycleManager?.register(self)
  }
  
  func updateType() {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      self.initializeCaptureSessionInput()
      if !session.isRunning {
        startSession()
      }
    }
  }
  
  func updateFlashMode() {
    guard let device = videoCaptureDeviceInput?.device else { return }
    
    if flashMode == .torch {
      if !device.hasTorch {
        return
      }
      
      do {
        try device.lockForConfiguration()
      } catch {
        log.info("\(#function): \(error.localizedDescription)")
        return
      }
      
      if device.hasTorch && device.isTorchModeSupported(.on) {
        device.torchMode = .on
      }
    } else {
      if !device.hasFlash {
        return
      }
      
      do {
        try device.lockForConfiguration()
      } catch {
        log.info("\(#function): \(error.localizedDescription)")
        return
      }
      
      if device.isTorchModeSupported(.off) {
        device.torchMode = .off
      }
    }
    
    device.unlockForConfiguration()
  }
  
  
  func startSession() {
#if targetEnvironment(simulator)
    return
#endif
    guard let manager = permissionsManager else {
      log.info("Permissions module not found.")
      return
    }
    if !manager.hasGrantedPermission(usingRequesterClass: CameraCameraPermissionRequester.self) {
      onMountError(["message": "Camera permissions not granted - component could not be rendered."])
      return
    }
    
    sessionQueue.async { [weak self] in
      guard let self else { return }
      if presetCamera == .unspecified {
        return
      }
      
      let photoOutput = AVCapturePhotoOutput()
      if photoOutput.isLivePhotoCaptureSupported {
        photoOutput.isLivePhotoCaptureEnabled = true
      }
      if session.canAddOutput(photoOutput) {
        session.addOutput(photoOutput)
        self.photoOutput = photoOutput
      }
      
      NotificationCenter.default.addObserver(forName: NSNotification.Name.AVCaptureSessionRuntimeError, object: session, queue: nil) { [weak self] notification in
        guard let self else { return }
        
        self.sessionQueue.async { [weak self] in
          guard let self else { return }
          self.session.startRunning()
          self.ensureSessionConfiguration()
          self.onCameraReady()
        }
      }
      
      sessionQueue.asyncAfter(deadline: .now() + round(50/1000000)) { [weak self] in
        guard let self else { return }
        maybeStartFaceDetection(presetCamera != .back)
        if barCodeScanner != nil {
          barCodeScanner?.maybeStartBarCodeScanning()
        }
        
        session.startRunning()
        ensureSessionConfiguration()
        onCameraReady()
      }
    }
  }
  
  func updateZoom() {
    guard let device = videoCaptureDeviceInput?.device else { return }
    
    do {
      try device.lockForConfiguration()
      device.videoZoomFactor = (device.activeFormat.videoMaxZoomFactor - 1.0) * zoom + 1.0
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
      return
    }
    
    device.unlockForConfiguration()
  }
  
  func updateFocusMode() {
    guard let device = videoCaptureDeviceInput?.device else { return }
    
    do {
      try device.lockForConfiguration()
      
      if device.isFocusModeSupported(autoFocus) {
        device.focusMode = autoFocus
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
      return
    }
    
    device.unlockForConfiguration()
  }
  
  func updateFocusDepth() {
    guard let device = videoCaptureDeviceInput?.device, device.focusMode == .locked else {
      return
    }
    
    if device.isLockingFocusWithCustomLensPositionSupported {
      do {
        try device.lockForConfiguration()
        device.setFocusModeLocked(lensPosition: focusDepth) { time in
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
    guard let device = videoCaptureDeviceInput?.device else { return }
    
    do {
      try device.lockForConfiguration()
      
      if whiteBalance == CameraWhiteBalance.auto {
        device.whiteBalanceMode = AVCaptureDevice.WhiteBalanceMode.autoWhiteBalance
        device.unlockForConfiguration()
      } else {
        let rgbGains = device.deviceWhiteBalanceGains(for: AVCaptureDevice.WhiteBalanceTemperatureAndTintValues(temperature: whiteBalance.temperature(), tint: 0))
        
        device.setWhiteBalanceModeLocked(with: rgbGains) { time in
          device.unlockForConfiguration()
        }
      }
    } catch {
      log.info("\(#function): \(error.localizedDescription)")
      return
    }
    
    device.unlockForConfiguration()
  }
  
  func onAppBackgrounded() {
    if session.isRunning && !paused {
      paused = true
      sessionQueue.async { [weak self] in
        guard let self else { return }
        session.stopRunning()
      }
    }
  }
  
  func onAppForegrounded() {
    if session.isRunning && paused {
      paused = false
      sessionQueue.async { [weak self] in
        guard let self else { return }
        session.startRunning()
        ensureSessionConfiguration()
      }
    }
  }
  
  func updatePictureSize() {
    updateSessionPreset(preset: pictureSize)
  }
  
  func setIsScanningBarCodes(scanning: Bool) {
    if barCodeScanner != nil {
      barCodeScanner?.setIsEnabled(scanning)
    } else if scanning {
      log.error("BarCodeScanner module not found. Make sure `expo-barcode-scanner` is installed and linked correctly.")
    }
  }
  
  func setBarCodeScannerSettings(settings: [String: Any]) {
    if barCodeScanner != nil {
      barCodeScanner?.setSettings(settings)
    }
  }
  
  func setIsDetectingFaces(detecting: Bool) {
    if faceDetector != nil {
      faceDetector?.setIsEnabled(detecting)
    } else if isDetectingFaces {
      log.error("FaceDetector module not found. Make sure `expo-face-detector` is installed and linked correctly.");
    }
  }
  
  func updateFaceDetectorSettings(settings: [String: Any]) {
    if faceDetector != nil {
      faceDetector?.updateSettings(settings)
    }
  }
  
  func takePicture(options: TakePictureOptions, promise: Promise) {
    if photoCapturedPromise != nil {
      promise.legacyRejecter("E_IMAGE_CAPTURE_FAILED", "Camera is not ready yet. Wait for 'onCameraReady' callback.", nil)
      return
    }
    
    guard let photoOutput else {
      promise.legacyRejecter("E_IMAGE_CAPTURE_FAILED", "Camera is not ready yet. Wait for 'onCameraReady' callback.", nil)
      return
    }
    
    let connection = photoOutput.connection(with: .video)
    connection?.videoOrientation = EXCameraUtils.videoOrientation(for: UIDevice.current.orientation)
    
    photoCapturedPromise = promise
    photoCaptureOptions = options
    
    let outputSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecJPEG])

//    outputSettings.isHighResolutionPhotoEnabled = true
    var requestedFlashMode = AVCaptureDevice.FlashMode.off
    
    switch flashMode {
    case .off:
      requestedFlashMode = .off
    case .auto:
      requestedFlashMode = .auto
    case .on, .torch:
      requestedFlashMode = .on
    }
    
    if photoOutput.supportedFlashModes.contains(requestedFlashMode) {
      outputSettings.flashMode = requestedFlashMode
    }
    photoOutput.capturePhoto(with: outputSettings, delegate: self)
  }
  
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    guard let promise = photoCapturedPromise, let options = photoCaptureOptions else { return }
    
    photoCapturedPromise = nil
    photoCaptureOptions = nil
    
    if error != nil {
      promise.legacyRejecter("E_IMAGE_CAPTURE_FAILED", "Image could not be captured", error);
      return
    }
    
    if fileSystem == nil {
      promise.legacyRejecter("E_IMAGE_CAPTURE_FAILED", "No file system module", nil);
      return;
    }
    
    let imageData = photo.fileDataRepresentation()
    handleCapturedImageData(imageData: imageData, metadata: photo.metadata, options: options, promise: promise)
  }
  
  func handleCapturedImageData(imageData: Data?, metadata: [String: Any], options: TakePictureOptions, promise: Promise) {
    guard let imageData else { return }
    
    guard var takenImage = UIImage(data: imageData) else { return }
    if options.fastMode {
      promise.resolve()
    }
    
    var previewSize: CGSize
    guard let orientation = window?.windowScene?.interfaceOrientation else { return }
    
    if orientation == .portrait {
      previewSize = CGSize(width: previewLayer?.frame.size.height ?? 0.0, height: previewLayer?.frame.size.width ?? 0.0)
    } else {
      previewSize = CGSize(width: previewLayer?.frame.size.width ?? 0.0, height: previewLayer?.frame.size.height ?? 0.0)
    }
    
    guard let takenCgImage = takenImage.cgImage else { return }
    
    let cropRect = CGRect(x: 0, y: 0, width: takenCgImage.width, height: takenCgImage.height)
    let croppedSize = AVMakeRect(aspectRatio: previewSize, insideRect: cropRect);
    
    takenImage = EXCameraUtils.cropImage(takenImage, to: croppedSize)
    
    let path = fileSystem?.generatePath(inDirectory: fileSystem?.cachesDirectory.appending("/Camera"), withExtension: ".jpg")
    
    let width = takenImage.size.width
    let height = takenImage.size.height
    var processedImageData: Data? = nil
    let quality = options.quality
    
    var response: [String: Any] = [:]
    
    if options.exif {
      let exifDict = metadata[kCGImagePropertyExifDictionary as String] as? [String: Any]
      var updatedExif = EXCameraUtils.updateExifMetadata(exifDict, withAdditionalData: ["Orientation": EXCameraUtils.export(takenImage.imageOrientation)])
      
      updatedExif?[kCGImagePropertyExifPixelYDimension] = width
      updatedExif?[kCGImagePropertyExifPixelXDimension] = height
      response["exif"] = updatedExif
      
      var updatedMetadata = metadata
      
      if let additionalExif = options.additionalExif {
        updatedExif?.addEntries(from: additionalExif)
        var gpsDict = [String: Any]()
        
        let gpsLatitude = additionalExif["GPSLatitude"] as? Double
        if let latitude = gpsLatitude {
          gpsDict[kCGImagePropertyGPSLatitude as String] = fabs(latitude)
          gpsDict[kCGImagePropertyGPSLatitudeRef as String] = latitude >= 0 ? "N" : "S"
        }
        
        let gpsLongitude = additionalExif["GPSLongitude"] as? Double
        if let longitude = gpsLongitude {
          gpsDict[kCGImagePropertyGPSLongitude as String] = fabs(longitude)
          gpsDict[kCGImagePropertyGPSLongitudeRef as String] = longitude >= 0 ? "E" : "W"
        }
        
        let gpsAltitude = additionalExif["GPSAltitude"] as? Double
        if let altitude = gpsAltitude {
          gpsDict[kCGImagePropertyGPSLongitude as String] = fabs(altitude)
          gpsDict[kCGImagePropertyGPSLongitudeRef as String] = altitude >= 0 ? 0 : 1
        }
        
        let metadataGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any]
        if updatedMetadata[kCGImagePropertyGPSDictionary as String] == nil {
          updatedMetadata[kCGImagePropertyGPSDictionary as String] = gpsDict
        } else {
          if var metadataGpsDict = updatedMetadata[kCGImagePropertyGPSDictionary as String] as? [String: Any] {
            gpsDict.forEach {
              metadataGpsDict[$0.key] = $0.value
            }
          }
        }
      }
      
      updatedMetadata[kCGImagePropertyExifDictionary as String] = updatedExif
      processedImageData = EXCameraUtils.data(from: takenImage, withMetadata: updatedMetadata, imageQuality: Float(quality))
    } else {
      processedImageData = takenImage.jpegData(compressionQuality: quality)
    }
    
    if processedImageData == nil {
      promise.legacyRejecter("E_IMAGE_SAVE_FAILED", "Could not save the image.", nil)
      return
    }
    
    response["uri"] = EXCameraUtils.writeImage(processedImageData, toPath: path)
    response["width"] = width
    response["height"] = height
    
    if options.base64 {
      response["base64"] = processedImageData?.base64EncodedString(options: .lineLength64Characters)
    }
    
    if options.fastMode {
      onPictureSaved(["data": response, "id": options.id])
    } else {
      promise.resolve(response)
    }
  }
  
  func record(options: CameraRecordingOptions, promise: Promise) {
    if movieFileOutput == nil {
      if faceDetector != nil {
        faceDetector?.stopFaceDetection()
      }
      setupMovieFileCapture()
    }
    
    if let movieFileOutput, !movieFileOutput.isRecording && videoRecordedPromise == nil {
      updateSessionAudioIsMuted(options.mute)
      
      guard let connection = movieFileOutput.connection(with: .video) else {
        log.info("No connection for media type")
        return
      }
      if connection.isVideoStabilizationSupported == false {
        log.warn("\(#function): Video Stabilization is not supported on this device.")
      } else {
        if let videoStabilizationMode {
          connection.preferredVideoStabilizationMode = videoStabilizationMode
        }
      }
      
      connection.videoOrientation = EXCameraUtils.videoOrientation(for: UIDevice.current.orientation)
      
      var preset: AVCaptureSession.Preset? = nil
      if let quality = options.quality {
        preset = quality.resolution()
      } else if session.sessionPreset == AVCaptureSession.Preset.photo {
        preset = AVCaptureSession.Preset.high
      }
      
      if let preset {
        updateSessionPreset(preset: preset)
      }
      
      setVideoOptions(options: options, for: connection, promise: promise)
      
      let canBeMirrored = connection.isVideoOrientationSupported
      if canBeMirrored && options.mirror {
        connection.isVideoMirrored = options.mirror
      }
      
      sessionQueue.async { [weak self] in
        guard let self else { return }
        if !isValidVideoOptions {
          return
        }
        
        if fileSystem == nil {
          promise.legacyRejecter("E_IMAGE_SAVE_FAILED", "No file system module", nil)
          return
        }
        
        guard let fileSystem else {
          promise.reject(Exceptions.FileSystemModuleNotFound())
          return
        }
        
        let directory = fileSystem.cachesDirectory.appending("Camera")
        let path = fileSystem.generatePath(inDirectory: directory, withExtension: ".mov")
        if let outputURL = URL(string: path) {
          movieFileOutput.startRecording(to: outputURL, recordingDelegate: self)
          videoRecordedPromise = promise
        }
      }
    }
  }
  
  func setVideoOptions(options: CameraRecordingOptions, for connection: AVCaptureConnection, promise: Promise) {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      isValidVideoOptions = true
      
      if let maxDuration = options.maxDuration {
        movieFileOutput?.maxRecordedDuration = CMTime(seconds: maxDuration, preferredTimescale: 30)
      }
      
      if let maxFileSize = options.maxFileSize {
        movieFileOutput?.maxRecordedFileSize = Int64(maxFileSize)
      }
      
      if let codec = options.codec {
        let codecType = codec.codecType()
        if let movieFileOutput {
          if movieFileOutput.availableVideoCodecTypes.contains(codecType) {
            movieFileOutput.setOutputSettings([AVVideoCodecKey: codecType], for: connection)
            self.videoCodecType = codecType
          } else {
            videoCodecType = nil
            let videoCodecErrorMessage = "Video Codec '\(videoCodecType?.rawValue)' is not supported on this device"
            
            promise.legacyRejecter("E_RECORDING_FAILED", videoCodecErrorMessage, nil)
            
            cleanupMovieFileCapture()
            videoRecordedPromise = nil
            isValidVideoOptions = false
          }
        }
      }
    }
  }
  
  func updateSessionAudioIsMuted(_ isMuted: Bool) {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      session.beginConfiguration()
      
      for input in session.inputs  {
        if let deviceInput = input as? AVCaptureDeviceInput {
          if deviceInput.device.hasMediaType(.audio) {
            if isMuted {
              self.session.removeInput(input)
            }
            session.commitConfiguration()
            return
          }
        }
      }
      
      if !isMuted {
        guard let audioCapturedevice = AVCaptureDevice.default(for: .audio) else {
          return
        }
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
      
      session.commitConfiguration()
    }
  }
  
  func setupMovieFileCapture() {
    let movieFileOutput = AVCaptureMovieFileOutput()
    if session.canAddOutput(movieFileOutput) {
      self.movieFileOutput = movieFileOutput
    }
  }
  
  func cleanupMovieFileCapture() {
    if let movieFileOutput {
      if session.outputs.contains(movieFileOutput) {
        session.removeOutput(movieFileOutput)
        self.movieFileOutput = nil
      }
    }
  }
  
  override func layoutSubviews() {
    previewLayer?.frame = self.bounds
    self.backgroundColor = .black
    if let previewLayer {
      self.layer.insertSublayer(previewLayer, at: 0)
    }
  }
  
  override func removeFromSuperview() {
    lifecycleManager?.unregisterAppLifecycleListener(self)
    self.stopSession()
    super.removeFromSuperview()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
  }
  
  func ensureSessionConfiguration() {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      updateFlashMode()
    }
  }
  
  func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
    
    if error != nil {
      videoRecordedPromise?.legacyRejecter("E_RECORDING_FAILED", "An error occurred while recording a video.", error)
    } else {
      videoRecordedPromise?.resolve(["uri": outputFileURL.absoluteString])
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
    guard let faceDetector else { return }
    let connection = photoOutput?.connection(with: .video)
    connection?.videoOrientation = EXCameraUtils.videoOrientation(for: UIDevice.current.orientation)
    faceDetector.maybeStartFaceDetection(on: session, with: previewLayer, mirrored: mirrored)
  }
  
  func setPresetCamera(presetCamera: AVCaptureDevice.Position) {
    self.presetCamera = presetCamera
    faceDetector?.updateMirrored(presetCamera.rawValue != 1)
  }
  
  func stopRecording() {
    movieFileOutput?.stopRecording()
  }
  
  func resumePreview() {
    previewLayer?.connection?.isEnabled = true
  }
  
  func pausePreview() {
    previewLayer?.connection?.isEnabled = false
  }

  func updateSessionPreset(preset: AVCaptureSession.Preset) {
#if targetEnvironment(simulator)
    sessionQueue.async { [weak self] in
      guard let self else { return }
      session.beginConfiguration()
      if session.canSetSessionPreset(preset) {
        session.sessionPreset = preset
      }
      session.commitConfiguration()
    }
#endif
  }
  
  func initializeCaptureSessionInput() {
    if (videoCaptureDeviceInput?.device.position == presetCamera) {
      return
    }
  
    var orientation: AVCaptureVideoOrientation?
    EXUtilities.performSynchronously { [weak self] in
      orientation = EXCameraUtils.videoOrientation(for: UIApplication.shared.statusBarOrientation)
    }
    
    guard let orientation  else { return }
    
    sessionQueue.async { [weak self] in
      guard let self else { return }
      session.beginConfiguration()
      
      guard let device = EXCameraUtils.device(withMediaType: AVMediaType.video.rawValue, preferring: presetCamera) else {
        return
      }
     
      do {
        let captureDeviceInput = try AVCaptureDeviceInput(device: device)
        if let videoCaptureDeviceInput {
          session.removeInput(videoCaptureDeviceInput)
        }
        
        if session.canAddInput(captureDeviceInput) {
          session.addInput(captureDeviceInput)
          videoCaptureDeviceInput = captureDeviceInput
          updateZoom()
          updateFocusMode()
          updateFocusDepth()
          previewLayer?.connection?.videoOrientation = orientation
        }
        session.commitConfiguration()
      } catch {
        var errorMessage = "Camera could not be started - "
        if error != nil {
          errorMessage.append(error.localizedDescription)
        } else {
          errorMessage.append("there's no captureDeviceInput available")
        }
        onMountError(["message": errorMessage])
      }
    }
    
    session.commitConfiguration()
  }
  
  private func stopSession() {
#if targetEnvironment(simulator)
    return
#endif
    sessionQueue.async { [weak self] in
      guard let self else { return }
      if let faceDetector {
        faceDetector.stopFaceDetection()
      }
      if let barCodeScanner {
        barCodeScanner.stopBarCodeScanning()
      }
      
      previewLayer?.removeFromSuperlayer()
      session.commitConfiguration()
      session.stopRunning()
      
      for input in session.inputs {
        session.removeInput(input)
      }
      
      for output in session.outputs {
        session.removeOutput(output)
      }
    }
  }
  
  @objc func orientationChanged(notification: Notification) {
    guard let orientation = window?.windowScene?.interfaceOrientation else { return }
    changePreviewOrientation(orientation: orientation)
  }
  
  func changePreviewOrientation(orientation: UIInterfaceOrientation) {
    let videoOrientation = EXCameraUtils.videoOrientation(for: orientation)
    EXUtilities.performSynchronously { [weak self] in
      guard let self else { return }
      if ((previewLayer?.connection?.isVideoOrientationSupported) != nil) {
        previewLayer?.connection?.videoOrientation = videoOrientation
      }
    }
  }
  
  private func createFaceDetectorManager() -> EXFaceDetectorManagerInterface? {
    let provider: EXFaceDetectorManagerProviderInterface? = appContext?.legacyModule(implementing: EXFaceDetectorManagerProviderInterface.self)
    
    guard let faceDetector = provider?.createFaceDetectorManager() else {
      return nil
    }
    
    faceDetector.setOnFacesDetected({ [weak self] faces in
      guard let self else { return }
      print("Face detected")
      self.onFacesDetected([
        "type": "face",
        "faces": faces
      ])
    })
    
    faceDetector.setSessionQueue(sessionQueue)
    return faceDetector
  }
  
  private func createBarCodeScanner() -> EXBarCodeScannerInterface? {
    guard let barCodeScnnerProvider: EXBarCodeScannerProviderInterface? = appContext?.legacyModule(implementing: EXBarCodeScannerProviderInterface.self) else {
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
      photoCapturedPromise.legacyRejecter("E_IMAGE_CAPTURE_FAILED", "Camera unmounted during taking photo process.", nil)
    }
  }
}
