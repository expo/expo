package expo.modules.devmenu.compose.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf

val LocalColors = staticCompositionLocalOf {
  lightColors
}

val LocalTypography = staticCompositionLocalOf {
  Typography
}

val LocalSpacing = staticCompositionLocalOf {
  Spacing
}

val LocalSizing = staticCompositionLocalOf {
  Sizing
}

@Composable
fun AppTheme(
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
    LocalSpacing provides Spacing,
    LocalTypography provides Typography,
    LocalSizing provides Sizing,
    content = content
  )
}

object Theme {
  val colors
    @Composable get() = LocalColors.current

  val typography
    @Composable get() = LocalTypography.current

  val spacing
    @Composable get() = LocalSpacing.current

  val sizing
    @Composable get() = LocalSizing.current
}
