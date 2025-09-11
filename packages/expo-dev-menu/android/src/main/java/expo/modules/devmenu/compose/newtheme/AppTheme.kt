package expo.modules.devmenu.compose.newtheme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.colorspace.ColorSpaces
import io.github.lukmccall.colors.RadixPallet
import io.github.lukmccall.colors.RawColor

private fun defaultColorConverter(rawColor: RawColor): Color {
  return when (rawColor) {
    is RawColor.SRgb -> Color(
      red = rawColor.r,
      green = rawColor.g,
      blue = rawColor.b,
      alpha = rawColor.a,
      colorSpace = ColorSpaces.Srgb
    )

    is RawColor.P3 -> Color(
      red = rawColor.r,
      green = rawColor.g,
      blue = rawColor.b,
      alpha = rawColor.a,
      colorSpace = ColorSpaces.DisplayP3
    )
  }
}

val lightPallet = RadixPallet(
  isDark = false,
  colorConverter = ::defaultColorConverter
)

val darkPallet = RadixPallet(
  isDark = true,
  colorConverter = ::defaultColorConverter
)

val LocalPallet = staticCompositionLocalOf {
  lightPallet
}

val LocalSpacing = staticCompositionLocalOf {
  Spacing
}

val LocalIsDarkTheme = staticCompositionLocalOf {
  false
}

val LocalBorderRadius = staticCompositionLocalOf {
  BorderRadius
}

val LocalColors = staticCompositionLocalOf {
  Colors(lightPallet)
}

val LocalTypography = staticCompositionLocalOf {
  Typography
}

@Composable
fun AppTheme(
  isDarkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit
) {
  val pallet = if (isDarkTheme) {
    darkPallet
  } else {
    lightPallet
  }

  CompositionLocalProvider(
    LocalPallet provides pallet,
    LocalSpacing provides Spacing,
    LocalIsDarkTheme provides isDarkTheme,
    LocalBorderRadius provides BorderRadius,
    LocalColors provides Colors(pallet),
    LocalTypography provides Typography,
    content = content
  )
}

object NewAppTheme {
  val pallet
    @Composable get() = LocalPallet.current

  val spacing
    @Composable get() = LocalSpacing.current

  val isDarkTheme
    @Composable get() = LocalIsDarkTheme.current

  val borderRadius
    @Composable get() = LocalBorderRadius.current

  val colors
    @Composable get() = LocalColors.current

  val font
    @Composable get() = LocalTypography.current
}
