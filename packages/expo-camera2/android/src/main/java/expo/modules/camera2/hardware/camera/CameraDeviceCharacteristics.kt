package expo.modules.camera2.hardware.camera

import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.util.Size

import expo.modules.camera2.hardware.orientation.toOrientation
import expo.modules.camera2.settings.Facing

/**
 * All valid and useful parameters that describes [CameraDevice] via [CameraCharacteristics]
 */
internal class CameraDeviceCharacteristics(
  cameraManager: CameraManager,
  cameraId: String
) {
  private val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId)
  val facing = cameraCharacteristics.get(CameraCharacteristics.LENS_FACING)!!.toFacing()
  val orientation = cameraCharacteristics.get(CameraCharacteristics.SENSOR_ORIENTATION)!!.toOrientation()
  val isMirrored = facing == Facing.FRONT
  val availablePreviewSizes: Array<Size> = cameraCharacteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)?.getOutputSizes(SurfaceTexture::class.java)
    ?: TODO("no available sizes")
}

private fun Int.toFacing(): Facing {
  return when (this) {
    CameraCharacteristics.LENS_FACING_FRONT -> Facing.FRONT
    CameraCharacteristics.LENS_FACING_BACK -> Facing.BACK
    CameraCharacteristics.LENS_FACING_EXTERNAL -> Facing.BACK
    else -> Facing.BACK
  }
}