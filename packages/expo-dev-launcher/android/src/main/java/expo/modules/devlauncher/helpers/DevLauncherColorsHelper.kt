package expo.modules.devlauncher.helpers

import android.graphics.Color

/**
 * If the string conforms to the "#RRGGBBAA" format then it's converted into the "#AARRGGBB" format.
 * Otherwise noop.
 */
fun RGBAtoARGB(rgba: String?): String? {
  if (rgba == null) {
    return null
  }
  return if (rgba.startsWith("#") && rgba.length == 9) {
    "#" + rgba.substring(7, 9) + rgba.substring(1, 7)
  } else rgba
}

fun isValidColor(color: String?): Boolean {
  return if (color == null) {
    false
  } else {
    try {
      Color.parseColor(color)
      true
    } catch (e: Exception) {
      false
    }
  }
}
