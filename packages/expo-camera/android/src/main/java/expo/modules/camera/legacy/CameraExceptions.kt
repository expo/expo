package expo.modules.camera.legacy

import expo.modules.kotlin.exception.CodedException

class CameraExceptions {
  class CameraIsNotRunning : CodedException(message = "Camera is not running")
}
