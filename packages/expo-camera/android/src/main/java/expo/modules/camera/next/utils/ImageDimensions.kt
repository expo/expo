package expo.modules.camera.next.utils

import expo.modules.camera.next.records.CameraType

data class ImageDimensions @JvmOverloads constructor(private val mWidth: Int, private val mHeight: Int, val rotation: Int = 0, val facing: CameraType = CameraType.BACK) {
  private val isLandscape: Boolean
    get() = rotation % 180 == 90
  val width: Int
    get() = if (isLandscape) {
      mHeight
    } else {
      mWidth
    }
  val height: Int
    get() = if (isLandscape) {
      mWidth
    } else {
      mHeight
    }
}
