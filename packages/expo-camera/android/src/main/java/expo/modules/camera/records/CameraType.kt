package expo.modules.camera.records

import androidx.camera.core.CameraSelector
import expo.modules.kotlin.types.Enumerable

enum class CameraType(val value: String) : Enumerable {
  FRONT("front"),
  BACK("back");

  fun mapToSelector() = when (this) {
    FRONT -> CameraSelector.DEFAULT_FRONT_CAMERA
    BACK -> CameraSelector.DEFAULT_BACK_CAMERA
  }
}