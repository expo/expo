package expo.modules.camera

import androidx.exifinterface.media.ExifInterface
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.media.CamcorderProfile
import android.os.Bundle
import android.view.ViewGroup

import com.google.android.cameraview.CameraView

import expo.modules.camera.events.CameraMountErrorEvent
import expo.modules.camera.events.CameraReadyEvent
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.camera.events.FacesDetectedEvent
import expo.modules.interfaces.facedetector.FaceDetectorInterface
import expo.modules.camera.events.FaceDetectionErrorEvent
import expo.modules.camera.events.PictureSavedEvent
import expo.modules.camera.events.BarCodeScannedEvent
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

object CameraViewHelper {
  // Mount error event
  @JvmStatic
  fun emitMountErrorEvent(emitter: EventEmitter, view: ViewGroup, message: String) {
    val event = CameraMountErrorEvent.obtain(message)
    emitter.emit(view.id, event)
  }

  // Camera ready event
  @JvmStatic
  fun emitCameraReadyEvent(emitter: EventEmitter, view: ViewGroup) {
    val event = CameraReadyEvent.obtain()
    emitter.emit(view.id, event)
  }

  // Bar code read event
  @JvmStatic
  fun emitBarCodeReadEvent(emitter: EventEmitter, view: ViewGroup, barCode: BarCodeScannerResult) {
    val event = BarCodeScannedEvent.obtain(view.id, barCode)
    emitter.emit(view.id, event)
  }

  // Face detection events
  @JvmStatic
  fun emitFacesDetectedEvent(emitter: EventEmitter, view: ViewGroup, faces: List<Bundle>) {
    val event = FacesDetectedEvent.obtain(view.id, faces)
    emitter.emit(view.id, event)
  }

  @JvmStatic
  fun emitFaceDetectionErrorEvent(emitter: EventEmitter, view: ViewGroup, faceDetector: FaceDetectorInterface) {
    val event = FaceDetectionErrorEvent.obtain(faceDetector)
    emitter.emit(view.id, event)
  }

  // Picture saved
  @JvmStatic
  fun emitPictureSavedEvent(emitter: EventEmitter, view: ViewGroup, info: Bundle) {
    val event = PictureSavedEvent.obtain(info)
    emitter.emit(view.id, event)
  }

  // Utilities
  @JvmStatic
  fun getCorrectCameraRotation(rotation: Int, facing: Int) =
    if (facing == CameraView.FACING_FRONT) (rotation - 90 + 360) % 360
    else (-rotation + 90 + 360) % 360

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

  fun generateSimulatorPhoto(width: Int, height: Int): Bitmap {
    val fakePhoto = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(fakePhoto)
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
    return fakePhoto
  }
}
