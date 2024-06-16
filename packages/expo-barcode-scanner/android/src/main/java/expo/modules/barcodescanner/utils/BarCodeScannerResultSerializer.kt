package expo.modules.barcodescanner.utils

import android.os.Bundle
import android.util.Pair
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult.BoundingBox

object BarCodeScannerResultSerializer {
  fun toBundle(result: BarCodeScannerResult, density: Float) =
    Bundle().apply {
      putString("data", result.value)
      putString("raw", result.raw)
      putInt("type", result.type)
      val cornerPointsAndBoundingBox = getCornerPointsAndBoundingBox(result.cornerPoints, result.boundingBox, density)
      putParcelableArrayList("cornerPoints", cornerPointsAndBoundingBox.first)
      putBundle("bounds", cornerPointsAndBoundingBox.second)
    }

  private fun getCornerPointsAndBoundingBox(
    cornerPoints: List<Int>,
    boundingBox: BoundingBox,
    density: Float
  ): Pair<ArrayList<Bundle>, Bundle> {
    val convertedCornerPoints = ArrayList<Bundle>()
    for (i in cornerPoints.indices step 2) {
      val x = cornerPoints[i].toFloat() / density
      val y = cornerPoints[i + 1].toFloat() / density

      convertedCornerPoints.add(getPoint(x, y))
    }
    val boundingBoxBundle = Bundle().apply {
      putParcelable("origin", getPoint(boundingBox.x.toFloat() / density, boundingBox.y.toFloat() / density))
      putParcelable("size", getSize(boundingBox.width.toFloat() / density, boundingBox.height.toFloat() / density))
    }
    return Pair(convertedCornerPoints, boundingBoxBundle)
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
