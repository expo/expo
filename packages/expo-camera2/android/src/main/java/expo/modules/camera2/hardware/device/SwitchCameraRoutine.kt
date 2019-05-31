package expo.modules.camera2.hardware.device

import expo.modules.camera2.hardware.camera.CameraController
import expo.modules.camera2.settings.Facing

/**
 * Switches to a new [Facing] camera. Will do nothing if [Facing] is same.
 * Will restart preview automatically if existing camera has started its preview.
 */
internal fun Device.switchCamera(
  newFacing: Facing
) {
  // No previously selected camera
  if (!hasSelectedCamera()) {
    updateFacing(newFacing)
    return
  }

  else if (getFacing() != newFacing) {
    updateFacing(newFacing)

    restartPreview(getSelectedCamera())
  }
}

internal fun Device.restartPreview(oldCameraController: CameraController) {
  stop(oldCameraController)
  startCamera()
}