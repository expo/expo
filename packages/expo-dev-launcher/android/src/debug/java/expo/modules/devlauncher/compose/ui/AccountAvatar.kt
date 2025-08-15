package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
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
      Icon(
        painter = painterResource(R.drawable.user),
        contentDescription = "User Icon",
        tint = NewAppTheme.colors.icon.tertiary,
        modifier = Modifier
          .background(NewAppTheme.colors.background.element)
          .padding(size / 4)
      )
    }
  }
}
