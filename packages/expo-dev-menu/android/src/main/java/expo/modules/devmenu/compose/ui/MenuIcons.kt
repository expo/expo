package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import com.composeunstyled.Icon
import expo.modules.devmenu.R

object MenuIcons {
  @Composable
  fun Close(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.x_close),
      contentDescription = "Close",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Copy(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.copy),
      contentDescription = "Copy",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Reload(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.refresh),
      contentDescription = "Reload",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Home(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.home),
      contentDescription = "Home",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Performance(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.performance),
      contentDescription = "Performance monitor",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Inspect(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.inspect),
      contentDescription = "Element inspector",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Bug(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.bug),
      contentDescription = "JS debugger",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Refresh(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.fast_refresh),
      contentDescription = "Fast Refresh",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Fab(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.dev_menu_fab_icon),
      contentDescription = "Toggle Dev Menu",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Warning(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.alert),
      contentDescription = "Warning",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }
}
