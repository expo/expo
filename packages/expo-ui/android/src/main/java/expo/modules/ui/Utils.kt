package expo.modules.ui

import android.graphics.Color
import android.os.Build

fun convertColor(color: Color?): androidx.compose.ui.graphics.Color {
  return color?.let {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      androidx.compose.ui.graphics.Color(it.red(), it.green(), it.blue(), it.alpha())
    } else {
      androidx.compose.ui.graphics.Color.Unspecified
    }
  } ?: androidx.compose.ui.graphics.Color.Unspecified
}