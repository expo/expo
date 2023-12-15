package expo.modules.camera.next

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import expo.modules.camera.next.records.CameraType
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

object CameraViewHelper {
  // Utilities
  @JvmStatic
  fun getCorrectCameraRotation(rotation: Int, facing: CameraType) =
    if (facing == CameraType.FRONT) {
      (rotation - 90 + 360) % 360
    } else {
      (-rotation + 90 + 360) % 360
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
