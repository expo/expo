package expo.modules.barcodescanner.utils

import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import android.os.Bundle
import android.util.Pair
import kotlin.math.max
import kotlin.math.min

object BarCodeScannerResultSerializer {
  fun toBundle(result: BarCodeScannerResult, density: Float): Bundle {
    val resultBundle = Bundle()
    resultBundle.putString("data", result.value)
    resultBundle.putInt("type", result.type)
    if (result.cornerPoints.isNotEmpty()) {
      val cornerPointsAndBoundingBox = getCornerPointsAndBoundingBox(result.cornerPoints, density)
      resultBundle.putParcelableArrayList("cornerPoints", cornerPointsAndBoundingBox.first)
      resultBundle.putBundle("bounds", cornerPointsAndBoundingBox.second)
    }
    return resultBundle
  }

  private fun getCornerPointsAndBoundingBox(cornerPoints: List<Int>, density: Float): Pair<ArrayList<Bundle>, Bundle> {
    val convertedCornerPoints = ArrayList<Bundle>()
    val boundingBox = Bundle()
    var minX = Float.MAX_VALUE
    var minY = Float.MAX_VALUE
    var maxX = Float.MIN_VALUE
    var maxY = Float.MIN_VALUE
    var i = 0
    while (i < cornerPoints.size) {
      val x = cornerPoints[i].toFloat() / density
      val y = cornerPoints[i + 1].toFloat() / density

      // finding bounding-box Coordinates
      minX = min(minX, x)
      minY = min(minY, y)
      maxX = max(maxX, x)
      maxY = max(maxY, y)
      convertedCornerPoints.add(getPoint(x, y))
      i += 2
    }
    boundingBox.putParcelable("origin", getPoint(minX, minY))
    boundingBox.putParcelable("size", getSize(maxX - minX, maxY - minY))
    return Pair(convertedCornerPoints, boundingBox)
  }

  private fun getSize(width: Float, height: Float): Bundle {
    val size = Bundle()
    size.putFloat("width", width)
    size.putFloat("height", height)
    return size
  }

  private fun getPoint(x: Float, y: Float): Bundle {
    val point = Bundle()
    point.putFloat("x", x)
    point.putFloat("y", y)
    return point
  }
}
