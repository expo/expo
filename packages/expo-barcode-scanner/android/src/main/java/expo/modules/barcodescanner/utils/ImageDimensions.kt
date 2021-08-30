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
}
