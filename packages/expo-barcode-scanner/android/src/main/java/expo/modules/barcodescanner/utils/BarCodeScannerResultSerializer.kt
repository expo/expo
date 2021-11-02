package expo.modules.barcodescanner.utils

import android.os.Bundle
import android.util.Pair
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import kotlin.math.max
import kotlin.math.min

object BarCodeScannerResultSerializer {
  fun toBundle(result: BarCodeScannerResult, density: Float) =
    Bundle().apply {
      putString("data", result.value)
      putInt("type", result.type)
      if (result.cornerPoints.isNotEmpty()) {
        val cornerPointsAndBoundingBox = getCornerPointsAndBoundingBox(result.cornerPoints, density)
        putParcelableArrayList("cornerPoints", cornerPointsAndBoundingBox.first)
        putBundle("bounds", cornerPointsAndBoundingBox.second)
      }
    }

  private fun getCornerPointsAndBoundingBox(cornerPoints: List<Int>, density: Float): Pair<ArrayList<Bundle>, Bundle> {
    val convertedCornerPoints = ArrayList<Bundle>()
    var minX = Float.MAX_VALUE
    var minY = Float.MAX_VALUE
    var maxX = Float.MIN_VALUE
    var maxY = Float.MIN_VALUE
    for (i in cornerPoints.indices step 2) {
      val x = cornerPoints[i].toFloat() / density
      val y = cornerPoints[i + 1].toFloat() / density
      // finding bounding-box Coordinates
      minX = min(minX, x)
      minY = min(minY, y)
      maxX = max(maxX, x)
      maxY = max(maxY, y)
      convertedCornerPoints.add(getPoint(x, y))
    }
    val boundingBox = Bundle().apply {
      putParcelable("origin", getPoint(minX, minY))
      putParcelable("size", getSize(maxX - minX, maxY - minY))
    }
    return Pair(convertedCornerPoints, boundingBox)
  }

  private fun getSize(width: Float, height: Float) =
    Bundle().apply {
      putFloat("width", width)
      putFloat("height", height)
    }

  private fun getPoint(x: Float, y: Float) =
    Bundle().apply {
      putFloat("x", x)
      putFloat("y", y)
    }
}
