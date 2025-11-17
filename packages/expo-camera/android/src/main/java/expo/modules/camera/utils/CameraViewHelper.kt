package expo.modules.camera.utils

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Bundle
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.roundToLong

object CameraViewHelper {
  // Utilities

  @JvmStatic
  fun getExifData(exifInterface: ExifInterface): Bundle {
    val exifMap = Bundle()
    for ((type, name) in exifTags) {
      if (exifInterface.getAttribute(name) != null) {
        when (type) {
          "string" -> exifMap.putString(name, exifInterface.getAttribute(name))
          "int" -> exifMap.putInt(name, exifInterface.getAttributeInt(name, 0))
          "double" -> exifMap.putDouble(name, exifInterface.getAttributeDouble(name, 0.0))
        }
      }
    }
    exifInterface.latLong?.let {
      exifMap.putDouble(ExifInterface.TAG_GPS_LATITUDE, it[0])
      exifMap.putDouble(ExifInterface.TAG_GPS_LONGITUDE, it[1])
      exifMap.putDouble(ExifInterface.TAG_GPS_ALTITUDE, exifInterface.getAltitude(0.0))
    }
    return exifMap
  }

  @JvmStatic
  @Throws(IllegalArgumentException::class)
  fun setExifData(baseExif: ExifInterface, exifMap: Map<String, Any>) {
    for ((type, name) in exifTags) {
      exifMap[name]?.let {
        // Convert possible type to string before putting into baseExif
        when (it) {
          is String -> baseExif.setAttribute(name, it)
          is Number -> baseExif.setAttribute(name, toValidExifRational(it, type))
          is Boolean -> baseExif.setAttribute(name, it.toString())
        }
      }
    }

    val latitudeValue = exifMap[ExifInterface.TAG_GPS_LATITUDE]
    val longitudeValue = exifMap[ExifInterface.TAG_GPS_LONGITUDE]
    if (latitudeValue is Number && longitudeValue is Number) {
      baseExif.setLatLong(
        latitudeValue.toDouble(),
        longitudeValue.toDouble()
      )
    }

    val altitudeValue = exifMap[ExifInterface.TAG_GPS_ALTITUDE]
    if (altitudeValue is Number) {
      baseExif.setAltitude(altitudeValue.toDouble())
    }
  }

  @JvmStatic
  @Throws(IOException::class)
  fun addExifData(baseExif: ExifInterface, additionalExif: ExifInterface) {
    for (tagInfo in exifTags) {
      val name = tagInfo[1]
      additionalExif.getAttribute(name)?.let {
        baseExif.setAttribute(name, it)
      }
    }
    baseExif.saveAttributes()
  }

  private fun toValidExifRational(value: Number, type: String): String {
    if (type == "double") {
      val scale = 1_000_000L
      val numerator = (value.toDouble() * scale).roundToLong()
      return "$numerator/$scale"
    }
    return value.toDouble().toBigDecimal().toPlainString()
  }

  fun generateSimulatorPhoto(width: Int, height: Int): ByteArray {
    val fakePhotoBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(fakePhotoBitmap)
    val background = Paint().apply {
      color = Color.BLACK
    }
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), background)
    val textPaint = Paint().apply {
      color = Color.YELLOW
      textSize = 35f
    }
    val calendar = Calendar.getInstance()
    val simpleDateFormat = SimpleDateFormat("dd.MM.yy HH:mm:ss", Locale.US)
    canvas.drawText(simpleDateFormat.format(calendar.time), width * 0.1f, height * 0.9f, textPaint)

    val stream = ByteArrayOutputStream()
    fakePhotoBitmap.compress(Bitmap.CompressFormat.PNG, 90, stream)
    val fakePhotoByteArray = stream.toByteArray()
    return fakePhotoByteArray
  }
}
