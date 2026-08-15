import ExpoModulesCore

internal final class CameraUnmountedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Camera unmounted during taking photo process"
  }
}

internal final class CameraNotReadyException: Exception, @unchecked Sendable {
  override var reason: String {
    "Camera is not ready yet"
  }
}

internal final class CameraOutputNotReadyException: Exception, @unchecked Sendable {
  override var reason: String {
    "Camera is not ready yet. Wait for 'onCameraReady' callback"
  }
}

internal final class CameraImageCaptureException: Exception, @unchecked Sendable {
  override var reason: String {
    "Image could not be captured"
  }
}

internal final class CameraSavingImageException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Failed to save image: \(param)"
  }
}

internal final class CameraRecordingException: GenericException<String?>, @unchecked Sendable {
  override var reason: String {
    "Video Codec '\(String(describing: param))' is not supported on this device"
  }
}

internal final class CameraRecordingFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "An error occurred while recording a video"
  }
}

internal final class CameraMetadataDecodingException: Exception, @unchecked Sendable {
  override var reason: String {
    "Could not decode image metadata"
  }
}

internal final class CameraInvalidPhotoData: Exception, @unchecked Sendable {
  override var reason: String {
    "An error occurred while generating photo data"
  }
}

internal final class CameraToggleRecordingException: Exception, @unchecked Sendable {
  override var reason: String {
    "`toggleRecording()` is only supported on iOS 18.0 or later"
  }
}

internal final class CameraScannerUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "Modern barcode scanner is not available on this device"
  }
}

internal final class DocumentScannerUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "Document scanning is unavailable on this device. Check `CameraView.isDocumentScannerAvailable` before calling `scanDocumentAsync`"
  }
}

internal final class DocumentScanFailedException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "The document scan could not be completed: \(param)"
  }
}
