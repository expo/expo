package expo.modules.camera.legacy.utils

data class ImageDimensions @JvmOverloads constructor(private val mWidth: Int, private val mHeight: Int, val rotation: Int = 0, val facing: Int = -1) {
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
