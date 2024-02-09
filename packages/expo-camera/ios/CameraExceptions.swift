import ExpoModulesCore

internal class CameraUnmountedException: Exception {
  override var reason: String {
    "Camera unmounted during taking photo process"
  }
}

internal class CameraNotReadyException: Exception {
  override var reason: String {
    "Camera unmounted during taking photo process"
  }
}

internal class CameraOutputNotReadyException: Exception {
  override var reason: String {
    "Camera is not ready yet. Wait for 'onCameraReady' callback"
  }
}

internal class CameraImageCaptureException: Exception {
  override var reason: String {
    "Image could not be captured"
  }
}

internal class CameraSavingImageException: Exception {
  override var reason: String {
    "Could not save the image"
  }
}

internal class CameraRecordingException: GenericException<String?> {
  override var reason: String {
    "Video Codec '\(param)' is not supported on this device"
  }
}

internal class CameraRecordingFailedException: Exception {
  override var reason: String {
    "An error occurred while recording a video"
  }
}

internal class CameraMetadataDecodingException: Exception {
  override var reason: String {
    "Could not decode image metadata"
  }
}

internal class CameraInvalidPhotoData: Exception {
  override var reason: String {
    "An error occured while generating photo data"
  }
}
