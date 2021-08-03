package expo.modules.barcodescanner.utils

class ImageDimensions(
  private val mWidth: Int,
  private val mHeight: Int,
  val rotation: Int = 0,
  val facing: Int = -1
) {
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

  override fun equals(other: Any?) =
    if (other is ImageDimensions) {
      other.mWidth == mWidth &&
        other.mHeight == mHeight &&
        other.facing == facing &&
        other.rotation == rotation
    } else {
      super.equals(other)
    }

  override fun hashCode(): Int {
    var result = mWidth
    result = 31 * result + mHeight
    result = 31 * result + rotation
    result = 31 * result + facing
    return result
  }
}
