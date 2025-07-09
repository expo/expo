import ExpoModulesCore

internal final class CameraUnmountedException: Exception {
  override var reason: String {
    "Camera unmounted during taking photo process"
  }
}

internal final class CameraNotReadyException: Exception {
  override var reason: String {
    "Camera unmounted during taking photo process"
  }
}

internal final class CameraOutputNotReadyException: Exception {
  override var reason: String {
    "Camera is not ready yet. Wait for 'onCameraReady' callback"
  }
}

internal final class CameraImageCaptureException: Exception {
  override var reason: String {
    "Image could not be captured"
  }
}

internal final class CameraSavingImageException: GenericException<String> {
  override var reason: String {
    "Failed to save image: \(param)"
  }
}

internal final class CameraRecordingException: GenericException<String?> {
  override var reason: String {
    "Video Codec '\(String(describing: param))' is not supported on this device"
  }
}

internal final class CameraRecordingFailedException: Exception {
  override var reason: String {
    "An error occurred while recording a video"
  }
}

internal final class CameraMetadataDecodingException: Exception {
  override var reason: String {
    "Could not decode image metadata"
  }
}

internal final class CameraInvalidPhotoData: Exception {
  override var reason: String {
    "An error occured while generating photo data"
  }
}

internal final class CameraToggleRecordingException: Exception {
  override var reason: String {
    "`toggleRecording()` is only supported on iOS 18.0 or later"
  }
}
