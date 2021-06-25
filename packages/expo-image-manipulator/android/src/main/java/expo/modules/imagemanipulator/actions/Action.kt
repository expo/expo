package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap

interface Action {
  fun run(bitmap: Bitmap): Bitmap
}
