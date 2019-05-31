package expo.modules.camera2.hardware.device

import expo.modules.camera2.hardware.camera.CameraController

/**
 * Stops the camera completely.
 */
internal fun Device.shutDown(
) {
  val cameraDevice = getSelectedCamera()
  stop(cameraDevice)

//  orientationSensor.stopMonitoring()
}

/**
 * Stops the camera.
 */
internal fun Device.stop(cameraController: CameraController) {
  cameraController.stopPreview()
  cameraController.closeCamera()
  clearSelectedCamera()
}