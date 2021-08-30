package expo.modules.barcodescanner.scanners

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.google.android.gms.vision.barcode.BarcodeDetector
import expo.modules.barcodescanner.utils.Frame
import expo.modules.barcodescanner.utils.FrameFactory.buildFrame
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings

class GMVBarCodeScanner(context: Context) : ExpoBarCodeScanner(context) {
  private var barcodeDetector =
    BarcodeDetector.Builder(mContext)
      .setBarcodeFormats(0)
      .build()
  override val isAvailable: Boolean
    get() = barcodeDetector.isOperational

  override fun scan(data: ByteArray, width: Int, height: Int, rotation: Int): BarCodeScannerResult? {
    return try {
      val results = scan(buildFrame(data, width, height, rotation))
      if (results.isNotEmpty()) results[0] else null
    } catch (e: Exception) {
      // Sometimes data has different size than width and height would suggest:
      // ByteBuffer.wrap(data).capacity() < width * height.
      // When given such arguments, Frame cannot be built and IllegalArgumentException is thrown.
      // See https://github.com/expo/expo/issues/2422.
      // In such case we can't do anything about it but ignore the frame.
      Log.e(TAG, "Failed to detect barcode: " + e.message)
      null
    }
  }

  override fun scanMultiple(bitmap: Bitmap): List<BarCodeScannerResult> {
    return scan(buildFrame(bitmap))
  }

  private fun scan(frame: Frame): List<BarCodeScannerResult> {
    return try {
      val result = barcodeDetector.detect(frame.frame)
      val results = mutableListOf<BarCodeScannerResult>()
      val width = frame.dimensions.width
      val height = frame.dimensions.height
      for (i in 0 until result.size()) {
        val barcode = result[result.keyAt(i)]
        val cornerPoints = mutableListOf<Int>()
        for (point in barcode.cornerPoints) {
          cornerPoints.addAll(listOf(point.x, point.y))
        }
        results.add(BarCodeScannerResult(barcode.format, barcode.rawValue, cornerPoints, height, width))
      }
      results
    } catch (e: Exception) {
      // for some reason, sometimes the very first preview frame the camera passes back to us
      // doesn't have the correct amount of data (data.length is too small for the height and width)
      // which throws, so we just return an empty list
      // subsequent frames are all the correct length & don't seem to throw
      Log.e(TAG, "Failed to detect barcode: " + e.message)
      emptyList()
    }
  }

  override fun setSettings(settings: BarCodeScannerSettings) {
    val newBarCodeTypes = parseBarCodeTypesFromSettings(settings)
    if (areNewAndOldBarCodeTypesEqual(newBarCodeTypes)) {
      return
    }
    val barcodeFormats = newBarCodeTypes?.reduce { acc, it ->
      acc or it
    } ?: 0
    barCodeTypes = newBarCodeTypes
    barcodeDetector.release()
    barcodeDetector = BarcodeDetector.Builder(mContext)
      .setBarcodeFormats(barcodeFormats)
      .build()
  }

  companion object {
    private val TAG = GMVBarCodeScanner::class.java.simpleName
  }
}
