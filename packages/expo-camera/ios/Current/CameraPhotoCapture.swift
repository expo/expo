import UIKit
import AVFoundation
import ExpoModulesCore

protocol CameraPhotoCaptureDelegate: AnyObject {
  var appContext: AppContext? { get }
  var previewLayer: AVCaptureVideoPreviewLayer { get }
  var deviceOrientation: UIInterfaceOrientation { get }
  var responsiveWhenOrientationLocked: Bool { get }
  var physicalOrientation: UIDeviceOrientation { get }
  var presetCamera: AVCaptureDevice.Position { get }
  var mirror: Bool { get }
  var flashMode: FlashMode { get }
  var onPictureSaved: EventDispatcher { get }
}

class CameraPhotoCapture: NSObject, AVCapturePhotoCaptureDelegate {
  weak var captureDelegate: CameraPhotoCaptureDelegate?

  // Serial + per-item autorelease: overlapping full-res photo pipelines can jetsam small devices
  private static let processingQueue = DispatchQueue(
    label: "com.expo.cameraPhotoProcessingQueue",
    qos: .userInitiated,
    autoreleaseFrequency: .workItem
  )

  private var photoCaptureOptions: TakePictureOptions?
  private var photoCapturedContinuation: CheckedContinuation<Any, Error>?

  init(delegate: CameraPhotoCaptureDelegate) {
    self.captureDelegate = delegate
    super.init()
  }

  func takePictureRef(options: TakePictureOptions, photoOutput: AVCapturePhotoOutput) async throws -> PictureRef {
    let optionsCopy = options
    optionsCopy.pictureRef = true

    let result = try await takePicture(options: optionsCopy, photoOutput: photoOutput)
    if let ref = result as? PictureRef {
      return ref
    }

    throw CameraImageCaptureException()
  }

  func takePicturePromise(options: TakePictureOptions, photoOutput: AVCapturePhotoOutput) async throws -> [String: Any] {
    let optionsCopy = options
    optionsCopy.pictureRef = false

    let result = try await takePicture(options: optionsCopy, photoOutput: photoOutput)

    if optionsCopy.fastMode {
      return [:]
    }

    if let result = result as? [String: Any] {
      return result
    }

    throw CameraImageCaptureException()
  }

  func takePicture(options: TakePictureOptions, photoOutput: AVCapturePhotoOutput) async throws -> Any {
    guard photoCapturedContinuation == nil else {
      throw CameraNotReadyException()
    }

    return try await withCheckedThrowingContinuation { continuation in
      photoCapturedContinuation = continuation
      photoCaptureOptions = options

      let connection = photoOutput.connection(with: .video)
      connection?.videoOrientation = ExpoCameraUtils.captureOrientation(
        responsiveWhenOrientationLocked: captureDelegate?.responsiveWhenOrientationLocked == true,
        physicalOrientation: captureDelegate?.physicalOrientation ?? .unknown,
        interfaceOrientation: captureDelegate?.deviceOrientation ?? .unknown
      )

      // options.mirror is deprecated but should continue to work until removed
      connection?.isVideoMirrored = captureDelegate?.presetCamera == .front &&
        ((captureDelegate?.mirror ?? false) || options.mirror)
      var photoSettings = AVCapturePhotoSettings()

      if photoOutput.availablePhotoCodecTypes.contains(AVVideoCodecType.hevc) {
        photoSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.hevc])
      }

      let requestedFlashMode = captureDelegate?.flashMode.toDeviceFlashMode() ?? .auto
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

  func photoOutput(_ output: AVCapturePhotoOutput, willCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    if photoCaptureOptions?.shutterSound == false {
      AudioServicesDisposeSystemSoundID(1108)
    }
  }

  func photoOutput(
    _ output: AVCapturePhotoOutput,
    didFinishProcessingPhoto photo: AVCapturePhoto,
    error: Error?
    ) {
    guard let options = photoCaptureOptions, let continuation = photoCapturedContinuation else {
      return
    }

    photoCapturedContinuation = nil
    photoCaptureOptions = nil

    if error != nil {
      continuation.resume(throwing: CameraImageCaptureException())
      return
    }

    // Processing a full-res still takes seconds and this callback can arrive on the main queue —
    // extract what we need from the photo, then do the heavy work off the delivery queue
    let imageData = photo.fileDataRepresentation()
    let metadata = photo.metadata
    let previewSize = currentPreviewSize()

    Self.processingQueue.async { [weak self] in
      guard let self else {
        continuation.resume(throwing: CameraImageCaptureException())
        return
      }
      do {
        let result = try self.processImageData(
          imageData: imageData,
          metadata: metadata,
          previewSize: previewSize,
          options: options
        )
        continuation.resume(returning: result)
      } catch {
        continuation.resume(throwing: error)
      }
    }
  }

  private func currentPreviewSize() -> CGSize {
    guard let captureDelegate else {
      return .zero
    }
    let size = captureDelegate.previewLayer.frame.size
    return captureDelegate.deviceOrientation == .portrait
      ? CGSize(width: size.height, height: size.width)
      : size
  }

  private func processImageData(
    imageData: Data?,
    metadata: [String: Any],
    previewSize: CGSize,
    options: TakePictureOptions
  ) throws -> Any {
    guard let captureDelegate else {
      throw CameraSavingImageException("Photo Capture delegate unavailable")
    }

    guard let imageData, var takenImage = UIImage(data: imageData) else {
      throw CameraSavingImageException("Failed to process image data")
    }

    guard let takenCgImage = takenImage.cgImage else {
      throw CameraSavingImageException("Failed to get CGImage")
    }

    let cropRect = CGRect(x: 0, y: 0, width: takenCgImage.width, height: takenCgImage.height)
    let croppedSize = AVMakeRect(aspectRatio: previewSize, insideRect: cropRect)

    takenImage = ExpoCameraUtils.crop(image: takenImage, to: croppedSize)

    let request = CaptureRequest(
      exif: options.exif,
      quality: options.quality,
      imageType: options.imageType,
      additionalExif: options.additionalExif
    )
    let result = try CapturedPhotoProcessor().process(
      image: takenImage,
      sourceMetadata: metadata,
      request: request
    )

    if options.pictureRef {
      if let image = UIImage(data: result.data) {
        return PictureRef(image)
      }
      throw CameraSavingImageException("Failed to create UIImage from processed data")
    }

    var response = [String: Any]()
    if let exif = result.exif {
      response["exif"] = exif
    }

    let path = FileSystemUtilities.generatePathInCache(
      captureDelegate.appContext,
      in: "Camera",
      extension: options.imageType.toExtension()
    )

    response["uri"] = ExpoCameraUtils.write(data: result.data, to: path)
    response["width"] = result.width
    response["height"] = result.height
    response["format"] = options.imageType.rawValue

    if options.base64 {
      response["base64"] = result.data.base64EncodedString()
    }

    if options.fastMode {
      captureDelegate.onPictureSaved(["data": response, "id": options.id])
      return ()
    }
    return response
  }

  func cleanup() {
    photoCapturedContinuation?.resume(throwing: CameraUnmountedException())
    self.photoCapturedContinuation = nil
  }
}
