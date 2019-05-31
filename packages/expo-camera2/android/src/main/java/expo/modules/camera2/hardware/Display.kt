package expo.modules.camera2.hardware

import android.content.Context
import android.view.Surface
import android.view.WindowManager

import expo.modules.camera2.hardware.orientation.Orientation

/**
 * A phone's display.
 */
class Display(context: Context) {

  private val display = context.getDisplay()

  /**
   * Returns the orientation of the screen.
   */
  fun getScreenOrientation(): Orientation = when (display.rotation) {
    Surface.ROTATION_0 -> Orientation.Vertical.Portrait
    Surface.ROTATION_90 -> Orientation.Horizontal.Landscape
    Surface.ROTATION_180 -> Orientation.Vertical.ReversePortrait
    Surface.ROTATION_270 -> Orientation.Horizontal.ReverseLandscape
    else -> Orientation.Vertical.Portrait
  }

}

private fun Context.getDisplay() = (getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay
