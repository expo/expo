package expo.modules.camera.legacy

import androidx.exifinterface.media.ExifInterface
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.media.CamcorderProfile
import android.os.Bundle

import com.google.android.cameraview.CameraView

import java.io.ByteArrayOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

object CameraViewHelper {
  // Utilities
  @JvmStatic
  fun getCorrectCameraRotation(rotation: Int, facing: Int) =
    if (facing == CameraView.FACING_FRONT) {
      (rotation - 90 + 360) % 360
    } else {
      (-rotation + 90 + 360) % 360
    }

  @JvmStatic
  fun getCamcorderProfile(cameraId: Int, quality: Int): CamcorderProfile {
    var profile = CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_HIGH)
    when (quality) {
      VIDEO_2160P -> profile = CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_2160P)
      VIDEO_1080P -> profile = CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_1080P)
      VIDEO_720P -> profile = CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_720P)
      VIDEO_480P -> profile = CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_480P)
      VIDEO_4x3 -> {
        profile = CamcorderProfile.get(cameraId, CamcorderProfile.QUALITY_480P)
        profile.videoFrameWidth = 640
      }
    }
    return profile
  }

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
    for ((_, name) in exifTags) {
      exifMap[name]?.let {
        // Convert possible type to string before putting into baseExif
        when (it) {
          is String -> baseExif.setAttribute(name, it)
          is Number -> baseExif.setAttribute(name, it.toDouble().toBigDecimal().toPlainString())
          is Boolean -> baseExif.setAttribute(name, it.toString())
        }
      }
    }

    if (exifMap.containsKey(ExifInterface.TAG_GPS_LATITUDE) &&
      exifMap.containsKey(ExifInterface.TAG_GPS_LONGITUDE) &&
      exifMap[ExifInterface.TAG_GPS_LATITUDE] is Number &&
      exifMap[ExifInterface.TAG_GPS_LONGITUDE] is Number
    ) {
      baseExif.setLatLong(
        exifMap[ExifInterface.TAG_GPS_LATITUDE] as Double,
        exifMap[ExifInterface.TAG_GPS_LONGITUDE] as Double
      )
    }

    if (exifMap.containsKey(ExifInterface.TAG_GPS_ALTITUDE) &&
      exifMap[ExifInterface.TAG_GPS_ALTITUDE] is Number
    ) {
      baseExif.setAltitude(exifMap[ExifInterface.TAG_GPS_ALTITUDE] as Double)
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
