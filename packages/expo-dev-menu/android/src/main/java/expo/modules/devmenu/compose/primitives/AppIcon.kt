package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.core.graphics.drawable.toBitmap
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AppIcon() {
  val context = LocalContext.current
  val icon = context.applicationInfo.icon

  Surface(
    shape = RoundedCornerShape(
      if (icon == 0) {
        Theme.sizing.borderRadius.medium
      } else {
        Theme.sizing.borderRadius.full
      }
    )
  ) {
    Box(
      modifier = Modifier
        .size(Theme.sizing.icon.extraLarge)
        .background(Theme.colors.background.secondary)
    ) {
      if (icon != 0) {
        // TODO(@lukmccall): It looks super weird to use the app icon as a bitmap here
        val image = remember {
          context.applicationInfo.loadIcon(context.packageManager).toBitmap().asImageBitmap()
        }
        Image(
          image,
          contentDescription = "App Icon",
          modifier = Modifier
            .fillMaxSize()
        )
      }
    }
  }
}
