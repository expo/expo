package abi49_0_0.expo.modules.camera

import abi49_0_0.expo.modules.kotlin.exception.CodedException

class CameraExceptions {
  class CameraIsNotRunning : CodedException(message = "Camera is not running")
}
