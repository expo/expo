package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import expo.modules.devlauncher.compose.primitives.AsyncImage
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun AccountAvatar(
  url: String?,
  size: Dp = 44.dp,
  modifier: Modifier = Modifier
) {
  RoundedSurface(
    borderRadius = NewAppTheme.borderRadius.full,
    modifier = Modifier
      .size(size)
      .then(modifier)
  ) {
    if (url != null) {
      AsyncImage(
        url = url
      )
    } else {
      LauncherIcons.User(
        size = size,
        tint = NewAppTheme.colors.icon.tertiary,
        modifier = Modifier
          .background(NewAppTheme.colors.background.element)
          .padding(size / 4)
      )
    }
  }
}
