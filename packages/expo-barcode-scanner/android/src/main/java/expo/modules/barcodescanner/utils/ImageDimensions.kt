package expo.modules.barcodescanner.utils

data class ImageDimensions(
  private val innerWidth: Int,
  private val innerHeight: Int,
  val rotation: Int = 0,
  val facing: Int = -1
) {
  private val isLandscape = rotation % 180 == 90
  val width = if (isLandscape) innerHeight else innerWidth
  val height = if (isLandscape) innerWidth else innerHeight

  override fun equals(other: Any?) =
    if (other is ImageDimensions) {
      other.innerWidth == innerWidth &&
        other.innerHeight == innerHeight &&
        other.facing == facing &&
        other.rotation == rotation
    } else {
      super.equals(other)
    }

  override fun hashCode(): Int {
    var result = innerWidth
    result = 31 * result + innerHeight
    result = 31 * result + rotation
    result = 31 * result + facing
    return result
  }
}
