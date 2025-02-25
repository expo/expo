package expo.modules.camera.utils

import android.os.Bundle

class BarCodeScannerResult(
  val type: Int,
  val value: String?,
  val raw: String?,
  val extra: Bundle,
  var cornerPoints: MutableList<Int>,
  var height: Int,
  var width: Int
) {
  data class BoundingBox(val x: Int, val y: Int, val width: Int, val height: Int)

  val boundingBox: BoundingBox
    get() {
      if (cornerPoints.isEmpty()) {
        return BoundingBox(0, 0, 0, 0)
      }
      var minX = Int.Companion.MAX_VALUE
      var minY = Int.Companion.MAX_VALUE
      var maxX = Int.Companion.MIN_VALUE
      var maxY = Int.Companion.MIN_VALUE

      var i = 0
      while (i < cornerPoints.size) {
        val x: Int = cornerPoints[i]
        val y: Int = cornerPoints[i + 1]

        minX = Integer.min(minX, x)
        minY = Integer.min(minY, y)
        maxX = Integer.max(maxX, x)
        maxY = Integer.max(maxY, y)
        i += 2
      }

      return BoundingBox(minX, minY, maxX - minX, maxY - minY)
    }
}
