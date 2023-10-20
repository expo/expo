package expo.modules.camera.next.records

import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

enum class CameraType(val value: String) : Enumerable {
  FRONT("front"),
  BACK("back");

  fun mapToSelector() = when (this) {
    FRONT -> CameraSelector.DEFAULT_FRONT_CAMERA
    BACK -> CameraSelector.DEFAULT_BACK_CAMERA
  }
}

enum class FlashMode(val value: String) : Enumerable {
  AUTO("auto"),
  ON("on"),
  OFF("off");

  fun mapToLens() = when (this) {
    AUTO -> ImageCapture.FLASH_MODE_AUTO
    OFF -> ImageCapture.FLASH_MODE_OFF
    ON -> ImageCapture.FLASH_MODE_ON
  }
}

enum class CameraMode(val value: String) : Enumerable {
  PICTURE("picture"),
  VIDEO("video")
}

class BarCodeSettings(
  val barcodeTypes: List<String>,
  val interval: Double?
) : Record