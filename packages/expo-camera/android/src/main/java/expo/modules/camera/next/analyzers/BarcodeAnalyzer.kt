package expo.modules.camera.next.analyzers

import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import expo.modules.camera.next.CameraViewHelper
import expo.modules.camera.next.records.BarcodeType
import expo.modules.camera.next.records.CameraType
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import java.nio.ByteBuffer

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

          val cornerPoints = mutableListOf<Int>()
          barcode.cornerPoints?.let { points ->
            for (point in points) {
              cornerPoints.addAll(listOf(point.x, point.y))
            }
          }

          onComplete(BarCodeScannerResult(barcode.format, barcode.displayValue, raw, cornerPoints, image.width, image.height))
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

private fun ByteBuffer.toByteArray(): ByteArray {
  rewind()
  val data = ByteArray(remaining())
  get(data)
  return data
}

fun Array<ImageProxy.PlaneProxy>.toByteArray() = this.fold(mutableListOf<Byte>()) { acc, plane ->
  acc.addAll(plane.buffer.toByteArray().toList())
  acc
}.toByteArray()
