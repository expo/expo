package host.exp.exponent.home

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import host.exp.exponent.services.ThemeSetting

val Typography = Typography(
  bodyLarge = TextStyle(
    fontFamily = FontFamily.Default,
    fontWeight = FontWeight.Normal,
    fontSize = 16.sp,
    lineHeight = 24.sp,
    letterSpacing = 0.5.sp
  )
)

val Shapes = Shapes(
  small = RoundedCornerShape(4.dp)
)

private val LightColors = lightColorScheme(
  primary = Color(0xFF5A5AD1),
  surface = Color(0xFFFFFFFF),
  background = Color(0xFFF7F7F7),
  onBackground = Color(0xFF1C1B1F),
  onSurfaceVariant = Color(0xFF757575)
)

private val DarkColors = darkColorScheme(
  primary = Color(0xFF9EA1FF),
  background = Color(0xFF000000),
  surface = Color(0xFF161B22),
  onSurface = Color(0xFFE6EDF3),
  onSurfaceVariant = Color(0xFF8B949E),
  outline = Color(0xFF30363D)
)

@Composable
fun HomeAppTheme(
  themeSetting: ThemeSetting,
  content: @Composable () -> Unit
) {
  val colorScheme = when (themeSetting) {
    ThemeSetting.Automatic -> if (isSystemInDarkTheme()) {
      DarkColors
    } else {
      LightColors
    }

    ThemeSetting.Dark -> DarkColors
    ThemeSetting.Light -> LightColors
  }

  MaterialTheme(
    colorScheme = colorScheme,
    shapes = Shapes,
    typography = Typography,
    content = content
  )
}
