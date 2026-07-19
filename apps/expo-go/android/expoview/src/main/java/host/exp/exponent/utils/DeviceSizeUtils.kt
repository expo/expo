package host.exp.exponent.utils

import android.content.Context
import android.util.DisplayMetrics
import kotlin.math.min

internal fun currentDeviceIsAPhone(context: Context): Boolean {
  val displayMetrics: DisplayMetrics = context.resources.displayMetrics
  val dpHeight = displayMetrics.heightPixels / displayMetrics.density
  val dpWidth = displayMetrics.widthPixels / displayMetrics.density

  // We can be pretty sure that if the smaller dimension is larger than 600dp we are not dealing with a phone
  // https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
  if (min(dpHeight, dpWidth) >= 600) {
    return false
  }
  return true
}
