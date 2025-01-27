package expo.modules.ui

import android.graphics.Color
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

@Composable
fun DynamicTheme(content: @Composable (() -> Unit)) {
  val context = LocalContext.current
  val colors = when {
    (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) -> {
      if (isSystemInDarkTheme()) {
        dynamicDarkColorScheme(context)
      } else {
        dynamicLightColorScheme(context)
      }
    }

    isSystemInDarkTheme() -> darkColorScheme()
    else -> lightColorScheme()
  }
  MaterialTheme(colorScheme = colors) {
    content()
  }
}

fun colorToComposeColor(color: Color?): androidx.compose.ui.graphics.Color {
  return color?.let {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      androidx.compose.ui.graphics.Color(it.red(), it.green(), it.blue(), it.alpha())
    } else {
      androidx.compose.ui.graphics.Color.Unspecified
    }
  } ?: androidx.compose.ui.graphics.Color.Unspecified
}

val Color?.compose: androidx.compose.ui.graphics.Color
  get() = colorToComposeColor(this)
