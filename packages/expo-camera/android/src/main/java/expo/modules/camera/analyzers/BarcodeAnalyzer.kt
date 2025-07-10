package expo.modules.camera.analyzers

import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import expo.modules.camera.CameraViewHelper
import expo.modules.camera.records.BarcodeType
import expo.modules.camera.records.CameraType
import expo.modules.camera.utils.BarCodeScannerResult

@OptIn(ExperimentalGetImage::class)
class BarcodeAnalyzer(private val lensFacing: CameraType, formats: List<BarcodeType>, val onComplete: (BarCodeScannerResult) -> Unit) : ImageAnalysis.Analyzer {
  private val barcodeFormats = if (formats.isEmpty()) {
    0
  } else {
    formats.map { it.mapToBarcode() }.reduce { acc, it ->
      acc or it
    }
  }
  private var barcodeScannerOptions =
    BarcodeScannerOptions.Builder()
      .setBarcodeFormats(barcodeFormats)
      .build()
  private var barcodeScanner = BarcodeScanning.getClient(barcodeScannerOptions)

  override fun analyze(imageProxy: ImageProxy) {
    val mediaImage = imageProxy.image

    if (mediaImage != null) {
      val rotation = CameraViewHelper.getCorrectCameraRotation(imageProxy.imageInfo.rotationDegrees, lensFacing)
      val image = InputImage.fromMediaImage(mediaImage, rotation)

      barcodeScanner.process(image)
        .addOnSuccessListener { barcodes ->
          if (barcodes.isEmpty()) {
            return@addOnSuccessListener
          }
          val barcode = barcodes.first()
          val raw = barcode.rawValue ?: barcode.rawBytes?.let { String(it) }

          val cornerPoints = barcode.cornerPoints?.let { points ->
            // Pre-allocate array
            IntArray(points.size * 2).apply {
              points.forEachIndexed { index, point ->
                this[index * 2] = point.x
                this[index * 2 + 1] = point.y
              }
            }.toMutableList()
          } ?: mutableListOf()

          val extra = BarCodeScannerResultSerializer.parseExtraDate(barcode)
          onComplete(
            BarCodeScannerResult(
              barcode.format,
              barcode.displayValue,
              raw,
              extra,
              cornerPoints,
              imageProxy.width,
              imageProxy.height
            )
          )
        }
        .addOnFailureListener {
          Log.d("SCANNER", it.cause?.message ?: "Barcode scanning failed")
        }
        .addOnCompleteListener {
          imageProxy.close()
        }
    }
  }
}

fun Array<ImageProxy.PlaneProxy>.toByteArray(): ByteArray {
  val totalSize = this.sumOf { it.buffer.remaining() }
  val result = ByteArray(totalSize)
  var offset = 0

  for (plane in this) {
    val buffer = plane.buffer
    val size = buffer.remaining()
    buffer.get(result, offset, size)
    offset += size
  }

  return result
}
