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
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class MLKitBarCodeScanner(context: Context) : ExpoBarCodeScanner(context) {
  private var barcodeScannerOptions =
    BarcodeScannerOptions.Builder()
      .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
      .build()
  private var barcodeScanner = BarcodeScanning.getClient(barcodeScannerOptions)

  override val isAvailable: Boolean
    get() = true

  override fun scan(imageData: ByteArray, width: Int, height: Int, rotation: Int) = try {
    val inputImage = InputImage.fromByteArray(imageData, width, height, rotation, InputImage.IMAGE_FORMAT_NV21)
    val results = scanBlocking(inputImage)
    if (results.isNotEmpty()) results[0] else null
  } catch (e: Exception) {
    Log.e(TAG, "Failed to detect barcode: " + e.message)
    null
  }

  override fun scanMultiple(bitmap: Bitmap): List<BarCodeScannerResult> {
    val inputImage = InputImage.fromBitmap(bitmap, 0)
    return scanBlocking(inputImage)
  }

  private fun scanBlocking(inputImage: InputImage): List<BarCodeScannerResult> = runBlocking(Dispatchers.IO) {
    try {
      val result: List<Barcode> = barcodeScanner.process(inputImage).await()
      val results = mutableListOf<BarCodeScannerResult>()
      if (result.isEmpty()) {
        return@runBlocking results
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
      return@runBlocking results
    } catch (e: Exception) {
      Log.e(TAG, "Failed to detect barcode: " + e.message)
      return@runBlocking emptyList()
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
