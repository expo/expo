package host.exp.exponent.kernel.fab

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource

@Composable
fun Icon(
  painter: Painter,
  contentDescription: String?,
  modifier: Modifier = Modifier,
  tint: Color
) {
  val colorFilter = remember(tint) {
    if (tint == Color.Unspecified) null else ColorFilter.tint(tint)
  }
  Image(painter, contentDescription, modifier, colorFilter = colorFilter)
}

@Composable
fun DayNightIcon(
  @DrawableRes id: Int,
  contentDescription: String?,
  modifier: Modifier = Modifier
) {
  DayNightIcon(
    painter = painterResource(id),
    contentDescription = contentDescription,
    modifier = modifier
  )
}

@Composable
fun DayNightIcon(
  painter: Painter,
  contentDescription: String?,
  modifier: Modifier = Modifier
) {
  Icon(
    painter = painter,
    contentDescription = contentDescription,
    modifier = modifier,
    tint = Theme.colors.icon.default
  )
}
