package expo.modules.camera.analyzers

import android.graphics.Bitmap
import android.util.Log
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class MLKitBarCodeScanner {
  private var barCodeTypes: List<Int>? = null
  private var barcodeScannerOptions =
    BarcodeScannerOptions.Builder()
      .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
      .build()
  private var barcodeScanner = BarcodeScanning.getClient(barcodeScannerOptions)

  suspend fun scan(bitmap: Bitmap): List<BarCodeScannerResult> = withContext(Dispatchers.IO) {
    val inputImage = InputImage.fromBitmap(bitmap, 0)
    try {
      val result: List<Barcode> = barcodeScanner.process(inputImage).await()
      val results = mutableListOf<BarCodeScannerResult>()
      if (result.isEmpty()) {
        return@withContext results
      }
      for (barcode in result) {
        val raw = barcode.rawValue ?: barcode.rawBytes?.let { String(it) }
        val value = if (barcode.valueType == Barcode.TYPE_CONTACT_INFO) {
          raw
        } else {
          barcode.displayValue
        }
        val cornerPoints = mutableListOf<Int>()
        barcode.cornerPoints?.let { points ->
          for (point in points) {
            cornerPoints.addAll(listOf(point.x, point.y))
          }
        }

        results.add(BarCodeScannerResult(barcode.format, value, raw, cornerPoints, inputImage.height, inputImage.width))
      }
      return@withContext results
    } catch (e: Exception) {
      Log.e(TAG, "Failed to detect barcode: " + e.message)
      return@withContext emptyList()
    }
  }

  fun setSettings(formats: List<Int>) {
    if (areNewAndOldBarCodeTypesEqual(formats)) {
      return
    }
    val barcodeFormats = formats.reduce { acc, it ->
      acc or it
    }

    barCodeTypes = formats
    barcodeScannerOptions = BarcodeScannerOptions.Builder()
      .setBarcodeFormats(barcodeFormats)
      .build()
    barcodeScanner = BarcodeScanning.getClient(barcodeScannerOptions)
  }

  private fun areNewAndOldBarCodeTypesEqual(newBarCodeTypes: List<Int>): Boolean {
    barCodeTypes?.run {
      // create distinct-values sets
      val prevTypesSet = toHashSet()
      val nextTypesSet = newBarCodeTypes.toHashSet()

      // sets sizes are equal -> possible content equality
      if (prevTypesSet.size == nextTypesSet.size) {
        prevTypesSet.removeAll(nextTypesSet)
        // every element from new set was in previous one -> sets are equal
        return prevTypesSet.isEmpty()
      }
    }
    return false
  }

  companion object {
    private val TAG = MLKitBarCodeScanner::class.java.simpleName
  }
}

suspend fun <T> Task<T>.await(): T = suspendCancellableCoroutine { continuation ->
  addOnSuccessListener { result ->
    continuation.resume(result)
  }
  addOnFailureListener { exception ->
    continuation.resumeWithException(exception)
  }
  addOnCanceledListener {
    continuation.cancel()
  }
}
