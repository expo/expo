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
      let orientation = captureDelegate?.responsiveWhenOrientationLocked == true ?
        captureDelegate?.physicalOrientation ?? .unknown : UIDevice.current.orientation
      connection?.videoOrientation = ExpoCameraUtils.videoOrientation(for: orientation)

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

    do {
      let result = try processImageData(
        imageData: photo.fileDataRepresentation(),
        metadata: photo.metadata,
        options: options
      )
      continuation.resume(returning: result)
    } catch {
      continuation.resume(throwing: error)
    }
  }

  private func processImageData(
    imageData: Data?,
    metadata: [String: Any],
    options: TakePictureOptions
  ) throws -> Any {
    guard let captureDelegate else {
      throw CameraSavingImageException("Photo Capture delegate unavailable")
    }

    guard let imageData, var takenImage = UIImage(data: imageData) else {
      throw CameraSavingImageException("Failed to process image data")
    }

    let previewSize = if captureDelegate.deviceOrientation == .portrait {
      CGSize(width: captureDelegate.previewLayer.frame.size.height, height: captureDelegate.previewLayer.frame.size.width)
    } else {
      CGSize(width: captureDelegate.previewLayer.frame.size.width, height: captureDelegate.previewLayer.frame.size.height)
    }

    guard let takenCgImage = takenImage.cgImage else {
      throw CameraSavingImageException("Failed to get CGImage")
    }

    let cropRect = CGRect(x: 0, y: 0, width: takenCgImage.width, height: takenCgImage.height)
    let croppedSize = AVMakeRect(aspectRatio: previewSize, insideRect: cropRect)

    takenImage = ExpoCameraUtils.crop(image: takenImage, to: croppedSize)

    let width = takenImage.size.width
    let height = takenImage.size.height
    var processedImageData: Data?

    var response = [String: Any]()

    if options.exif {
      guard let exifDict = metadata[kCGImagePropertyExifDictionary as String] as? [String: Any] else {
        throw CameraSavingImageException("Failed to process EXIF data")
      }

      var updatedExif = ExpoCameraUtils.updateExif(
        metadata: exifDict,
        with: ["Orientation": ExpoCameraUtils.toExifOrientation(orientation: takenImage.imageOrientation)]
      )

      updatedExif[kCGImagePropertyExifPixelYDimension as String] = width
      updatedExif[kCGImagePropertyExifPixelXDimension as String] = height
      response["exif"] = updatedExif

      var updatedMetadata = metadata

      if let additionalExif = options.additionalExif {
        for (key, value) in additionalExif {
          updatedExif[key] = value
        }
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
      if options.imageType == .png {
        processedImageData = takenImage.pngData()
      } else {
        processedImageData = takenImage.jpegData(compressionQuality: options.quality)
      }
    }

    guard let processedImageData else {
      throw CameraSavingImageException("Image data could not be processed")
    }

    if options.pictureRef {
      if let image = UIImage(data: processedImageData) {
        return PictureRef(image)
      }
      throw CameraSavingImageException("Failed to create UIImage from processed data")
    }

    let path = FileSystemUtilities.generatePathInCache(
      captureDelegate.appContext,
      in: "Camera",
      extension: options.imageType.toExtension()
    )

    response["uri"] = ExpoCameraUtils.write(data: processedImageData, to: path)
    response["width"] = width
    response["height"] = height
    response["format"] = options.imageType.rawValue

    if options.base64 {
      response["base64"] = processedImageData.base64EncodedString()
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
