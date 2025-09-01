package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import com.composeunstyled.Icon
import expo.modules.devlauncher.R

object LauncherIcons {
  @Composable
  fun Plus(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.plus),
      contentDescription = "Plus",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun ExpoLogo(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.expo_logo),
      contentDescription = "Expo Logo",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun ShowAtLaunch(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.show_at_launch),
      contentDescription = "Show at launch",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Settings(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.settings),
      contentDescription = "Settings",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun User(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.user),
      contentDescription = "User",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun CheckCircle(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.check_circle),
      contentDescription = "Check",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun UpdatesNav(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.updates_nav),
      contentDescription = "Updates",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Updates(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.update_icon),
      contentDescription = "Updates",
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
  fun Download(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.download),
      contentDescription = "Download",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Scan(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.scan),
      contentDescription = "Scan",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Chevron(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.chevron_right),
      contentDescription = "Chevron",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }

  @Composable
  fun Branch(
    size: Dp,
    tint: Color,
    modifier: Modifier = Modifier
  ) {
    Icon(
      painter = painterResource(R.drawable.branch_icon),
      contentDescription = "Branch",
      tint = tint,
      modifier = Modifier
        .size(size)
        .then(modifier)
    )
  }
}
