package expo.modules.camera.analyzers

import android.os.Bundle
import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.barcode.common.Barcode.BarcodeValueType
import com.google.mlkit.vision.common.InputImage
import expo.modules.camera.CameraViewHelper
import expo.modules.camera.records.BarcodeType
import expo.modules.camera.records.CameraType
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

          val extra = parseExtraDate(barcode)

          onComplete(BarCodeScannerResult(barcode.format, barcode.displayValue, raw, extra, cornerPoints, image.width, image.height))
        }
        .addOnFailureListener {
          Log.d("SCANNER", it.cause?.message ?: "Barcode scanning failed")
        }
        .addOnCompleteListener {
          imageProxy.close()
        }
    }
  }

  private fun parseExtraDate(barcode: Barcode): Bundle {
    val result = Bundle()

    when (barcode.valueType) {
      Barcode.TYPE_CONTACT_INFO -> {
        val info = barcode.contactInfo
        result.apply {
          putString("type", "contactInfo")
          putString("firstName", info?.name?.first)
          putString("middleName", info?.name?.middle)
          putString("lastName", info?.name?.last)
          putString("title", info?.title)
          putString("organization", info?.organization)
          putString("email", info?.emails?.firstOrNull()?.address)
          putString("phone", info?.phones?.firstOrNull()?.number)
          putString("url", info?.urls?.firstOrNull())
          putString("address", info?.addresses?.firstOrNull()?.addressLines?.firstOrNull())
        }
      }

      Barcode.TYPE_GEO -> {
        val geo = barcode.geoPoint
        result.apply {
          putString("type", "geoPoint")
          putString("lat", geo?.lat.toString())
          putString("lng", geo?.lng.toString())
        }
      }

      Barcode.TYPE_SMS -> {
        val sms = barcode.sms
        result.apply {
          putString("type", "sms")
          putString("phoneNumber", sms?.phoneNumber)
          putString("message", sms?.message)
        }
      }

      Barcode.TYPE_URL -> {
        val url = barcode.url
        result.putString("type", "url")
        result.putString("url", url?.url)
      }

      Barcode.TYPE_CALENDAR_EVENT -> {
        val event = barcode.calendarEvent
        result.apply {
          result.putString("type", "calendarEvent")
          putString("summary", event?.summary)
          putString("description", event?.description)
          putString("location", event?.location)
          putString("start", event?.start?.toString())
          putString("end", event?.end?.toString())
        }
      }

      Barcode.TYPE_DRIVER_LICENSE -> {
        val license = barcode.driverLicense
        result.apply {
          result.putString("type", "driverLicense")
          putString("firstName", license?.firstName)
          putString("middleName", license?.middleName)
          putString("lastName", license?.lastName)
          putString("licenseNumber", license?.licenseNumber)
          putString("expiryDate", license?.expiryDate)
          putString("issueDate", license?.issueDate)
          putString("addressStreet", license?.addressStreet)
          putString("addressCity", license?.addressCity)
          putString("addressState", license?.addressState)
        }
      }

      Barcode.TYPE_EMAIL -> {
        val email = barcode.email
        result.apply {
          result.putString("type", "email")
          putString("address", email?.address)
          putString("subject", email?.subject)
          putString("body", email?.body)
        }
      }

      Barcode.TYPE_PHONE -> {
        val phone = barcode.phone
        result.apply {
          result.putString("type", "phone")
          putString("number", phone?.number)
          putString("phoneNumberType", phone?.type.toString())
        }
      }

      Barcode.TYPE_WIFI -> {
        val wifi = barcode.wifi
        result.apply {
          result.putString("type", "wifi")
          putString("ssid", wifi?.ssid)
          putString("password", wifi?.password)
          putString("type", wifi?.encryptionType.toString())
        }
      }
    }

    return result
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
