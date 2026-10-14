package expo.modules.camera.analyzers

import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import expo.modules.camera.records.BarcodeType
import expo.modules.camera.utils.BarCodeScannerResult
import java.io.Closeable

@OptIn(ExperimentalGetImage::class)
class BarcodeAnalyzer(
  private val barcodeScanner: BarcodeScanner,
  val onComplete: (BarCodeScannerResult) -> Unit
) : ImageAnalysis.Analyzer, Closeable {
  constructor(formats: List<BarcodeType>, onComplete: (BarCodeScannerResult) -> Unit) : this(
    BarcodeScanning.getClient(
      BarcodeScannerOptions.Builder()
        .setBarcodeFormats(barcodeFormats(formats))
        .build()
    ),
    onComplete
  )

  override fun analyze(imageProxy: ImageProxy) {
    val mediaImage = imageProxy.image

    if (mediaImage != null) {
      val rotationDegrees = imageProxy.imageInfo.rotationDegrees
      val image = InputImage.fromMediaImage(mediaImage, rotationDegrees)

      // MLKit returns coordinates in the upright (rotated) coordinate space,
      // so we need the post-rotation dimensions for correct scaling.
      val isRotated = rotationDegrees == 90 || rotationDegrees == 270
      val effectiveWidth = if (isRotated) {
        imageProxy.height
      } else {
        imageProxy.width
      }
      val effectiveHeight = if (isRotated) {
        imageProxy.width
      } else {
        imageProxy.height
      }

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
              effectiveHeight,
              effectiveWidth
            )
          )
        }
        .addOnFailureListener {
          Log.d("SCANNER", it.cause?.message ?: "Barcode scanning failed")
        }
        .addOnCompleteListener {
          imageProxy.close()
        }
    } else {
      imageProxy.close()
    }
  }

  override fun close() {
    barcodeScanner.close()
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

private fun barcodeFormats(formats: List<BarcodeType>): Int =
  if (formats.isEmpty()) {
    0
  } else {
    formats.map { it.mapToBarcode() }.reduce { acc, it ->
      acc or it
    }
  }
