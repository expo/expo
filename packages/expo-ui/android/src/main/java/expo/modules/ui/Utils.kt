package expo.modules.ui

import android.graphics.Color
import android.os.Build
import android.util.Log
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
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

fun colorToComposeColorOrNull(color: Color?): androidx.compose.ui.graphics.Color? {
  return color?.let {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      androidx.compose.ui.graphics.Color(it.red(), it.green(), it.blue(), it.alpha())
    } else {
      null
    }
  }
}

fun colorToComposeColor(color: Color?): androidx.compose.ui.graphics.Color {
  return colorToComposeColorOrNull(color) ?: androidx.compose.ui.graphics.Color.Unspecified
}

val Color?.compose: androidx.compose.ui.graphics.Color
  get() = colorToComposeColor(this)

val Color?.composeOrNull: androidx.compose.ui.graphics.Color?
  get() = colorToComposeColorOrNull(this)

/**
 * Gets the ImageVector for a given icon name using reflection.
 */
fun getImageVector(icon: String?): ImageVector? {
  if (icon.isNullOrEmpty()) return null
  return try {
    val (theme, name) = icon.split(".")
    val clazz = Class.forName("androidx.compose.material.icons.$theme.${name}Kt")
    clazz.declaredMethods[0].invoke(clazz::class, null) as ImageVector
  } catch (e: Exception) {
    Log.w("ExpoUI", "The icon $icon couldn't be found.")
    return null
  }
}
