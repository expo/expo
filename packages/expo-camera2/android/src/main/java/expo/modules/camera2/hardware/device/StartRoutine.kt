package expo.modules.camera2.hardware.device

import android.support.annotation.WorkerThread

import expo.modules.camera2.exception.CameraException

/**
 * Starts device's sensors including camera sensor based on selected facing
 */
@WorkerThread
internal fun Device.start() {
  if (hasSelectedCamera()) {
    throw CameraException("Camera already started")
  }

  startOrientationMonitoring()
  startCamera()
}

/**
 * Starts selected camera sensor
 */
@WorkerThread
internal fun Device.startCamera() {
  selectCamera()

  val camera = getSelectedCamera()

  // calculating preview size
  preview.setAvailablePreviewSizes(camera.getAvailablePreviewSizes())

  with(camera) {
    attachPreview(preview)
    openCamera()
    updateConfiguration(configuration = cameraConfiguration)
  }
}