package expo.modules.devmenu.compose.theme

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import expo.modules.devmenu.compose.ripple.ripple

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

val LocalIsDarkTheme = staticCompositionLocalOf {
  false
}

val LocalColor = staticCompositionLocalOf {
  lightColors.text.default
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
    LocalIsDarkTheme provides isDarkTheme,
    LocalIndication provides ripple(),
    LocalColor provides colors.text.default,
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

  val isDarkTheme
    @Composable get() = LocalIsDarkTheme.current
}
