package expo.modules.devmenu.compose.primitives

import androidx.annotation.DrawableRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import com.composeunstyled.Icon
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun DayNighIcon(
  @DrawableRes id: Int,
  contentDescription: String?,
  modifier: Modifier = Modifier
) {
  DayNighIcon(
    painter = painterResource(id),
    contentDescription = contentDescription,
    modifier = modifier
  )
}

@Composable
fun DayNighIcon(
  painter: Painter,
  contentDescription: String?,
  modifier: Modifier = Modifier
) {
  Icon(
    painter = painter,
    contentDescription = contentDescription,
    modifier = modifier,
    tint = NewAppTheme.colors.icon.tertiary
  )
}
