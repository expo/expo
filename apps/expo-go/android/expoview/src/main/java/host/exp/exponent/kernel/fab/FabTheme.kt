package host.exp.exponent.kernel.fab

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.core.graphics.toColorInt

/**
 * Minimal theme provider meant to provide colors for the FAB.
 * The values were copied over from the new expo-dev-menu implementation
 */

data class Colors(
  val background: Background,
  val icon: Icon,
  val border: Border
)

data class Background(
  val default: Color
)

data class Icon(
  val default: Color
)

data class Border(
  val default: Color
)

val lightColors = Colors(
  background = Background(
    default = Color("#ffffff".toColorInt())
  ),
  icon = Icon(
    default = Color("#596068".toColorInt())
  ),
  border = Border(
    default = Color("#e1e4e8".toColorInt())
  )
)

val darkColors = Colors(
  background = Background(
    default = Color("#161b22".toColorInt())
  ),
  icon = Icon(
    default = Color("#c9d1d9".toColorInt())
  ),
  border = Border(
    default = Color("#484f58".toColorInt())
  )
)

val LocalColors = staticCompositionLocalOf {
  lightColors
}

@Composable
fun FabTheme(
  isDarkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit
) {
  val colors = if (isDarkTheme) {
    darkColors
  } else {
    lightColors
  }

  CompositionLocalProvider(
    LocalColors provides colors,
    content = content
  )
}

object Theme {
  val colors
    @Composable get() = LocalColors.current
}
