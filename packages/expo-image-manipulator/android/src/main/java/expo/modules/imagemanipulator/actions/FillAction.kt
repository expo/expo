package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import androidx.annotation.ColorInt

class FillAction(@ColorInt private val fillColor: Int) : Action {
  override fun run(bitmap: Bitmap): Bitmap {
    return bitmap.copy(bitmap.config, true).apply {
      eraseColor(fillColor)
      Canvas(this).apply {
        drawBitmap(bitmap, 0f, 0f, null)
      }
    }
  }

  companion object {
    fun fromObject(fillString: String): FillAction {
      val fillColor = Color.parseColor(fillString)
      return FillAction(fillColor)
    }
  }
}
