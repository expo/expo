package expo.modules.camera

import expo.modules.kotlin.exception.CodedException

class CameraExceptions {
  class CameraIsNotRunning : CodedException(message = "Camera is not running")

  class ImageCaptureFailed : CodedException(message = "Failed to capture image")
}
