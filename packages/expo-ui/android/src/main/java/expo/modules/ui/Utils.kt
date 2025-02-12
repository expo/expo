package expo.modules.ui

import android.graphics.Color
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.icons.Icons
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
    val iconsPackage = "androidx.compose.material.icons"
    val iconName = snakeToPascalCase(icon)
    val className = "${iconsPackage}.filled.${iconName}Kt"
    Class.forName(className)
      .getDeclaredMethod("get$iconName", Icons.Filled.javaClass)
      .invoke(null, Icons.Filled) as ImageVector
  } catch (e: Throwable) {
    null
  }
}

fun snakeToPascalCase(input: String): String {
  return input.split('_').joinToString("") { word ->
    word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
  }.let {
    if (it.first().isDigit()) "_$it" else it
  }
}
