package expo.modules.barcodescanner.scanners

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import kotlinx.coroutines.*
import kotlin.coroutines.resumeWithException

@OptIn(ExperimentalCoroutinesApi::class)
suspend fun <T> Task<T>.await(): T = suspendCancellableCoroutine { continuation ->
  addOnSuccessListener { result ->
    continuation.resume(result) { exception ->
      Log.e("Task", "Task is failed: ${exception.message}")
    }
  }
  addOnFailureListener { exception ->
    continuation.resumeWithException(exception)
  }
  addOnCanceledListener {
    continuation.cancel()
  }
}

class MLKitBarCodeScanner(context: Context) : ExpoBarCodeScanner(context) {

  private var barcodeScannerOptions =
    BarcodeScannerOptions.Builder()
      .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS) // Barcode.FORMAT_ALL_FORMATS
      .build()
  private var barcodeScanner = BarcodeScanning.getClient(barcodeScannerOptions)

  override val isAvailable: Boolean
    get() = true

  override fun scan(imageData: ByteArray, width: Int, height: Int, rotation: Int): BarCodeScannerResult? {
    return try {
      val inputImage = InputImage.fromByteArray(imageData, width, height, rotation, InputImage.IMAGE_FORMAT_NV21)
      val results = scanBlocking(inputImage)
      if (results.isNotEmpty()) results[0] else null
    } catch (e: Exception) {
      Log.e(TAG, "Failed to detect barcode: " + e.message)
      null
    }
  }

  override fun scanMultiple(bitmap: Bitmap): List<BarCodeScannerResult> {
    val inputImage = InputImage.fromBitmap(bitmap, 0)
    return scanBlocking(inputImage)
  }

  private fun scanBlocking(inputImage: InputImage): List<BarCodeScannerResult> = runBlocking(Dispatchers.IO) {
    try {
      val result = barcodeScanner.process(inputImage).await()
      val results = mutableListOf<BarCodeScannerResult>()
      if (result == null) { results }
      for (i in 0 until result.size) {
        val barcode = result[i]
        val value = barcode.rawValue ?: barcode.rawBytes?.let { String(it) }
        val cornerPoints = mutableListOf<Int>()
        barcode.cornerPoints?.let { points ->
          for (point in points) {
            cornerPoints.addAll(listOf(point.x, point.y))
          }
        }
        results.add(BarCodeScannerResult(barcode.format, value, cornerPoints, inputImage.height, inputImage.width))
      }
      results
    } catch (e: Exception) {
      Log.e(TAG, "Failed to detect barcode: " + e.message)
      mutableListOf<BarCodeScannerResult>()
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
    barcodeScannerOptions = BarcodeScannerOptions.Builder()
      .setBarcodeFormats(barcodeFormats)
      .build()
    barcodeScanner = BarcodeScanning.getClient(barcodeScannerOptions)
  }

  companion object {
    private val TAG = MLKitBarCodeScanner::class.java.simpleName
  }
}
