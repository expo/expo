package abi47_0_0.expo.modules.imagemanipulator.actions

import android.graphics.Bitmap

interface Action {
  fun run(bitmap: Bitmap): Bitmap
}
