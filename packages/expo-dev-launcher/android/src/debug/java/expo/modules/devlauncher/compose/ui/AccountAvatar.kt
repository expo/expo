package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import com.composables.core.Icon
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.primitives.AsyncImage
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AccountAvatar(
  url: String?,
  size: Dp = Theme.sizing.icon.medium,
  modifier: Modifier = Modifier
) {
  RoundedSurface(
    borderRadius = Theme.sizing.borderRadius.full,
    modifier = Modifier.size(size).then(modifier)
  ) {
    if (url != null) {
      AsyncImage(
        url = url
      )
    } else {
      Icon(
        painterResource(R.drawable._expodevclientcomponents_assets_buildingicon),
        contentDescription = "Avatar",
        modifier = Modifier.padding(Theme.spacing.micro)
      )
    }
  }
}
