package expo.modules.devmenu.compose.primitives

import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable
import android.os.Build
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.graphics.drawable.toBitmap
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.utils.IsRunningInPreview

@Composable
fun AppIcon(
  size: Dp = 44.dp
) {
  val context = LocalContext.current
  val density = LocalDensity.current

  RoundedSurface(
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Box(
      modifier = Modifier
        .size(size)
        .background(NewAppTheme.colors.background.element)
    ) {
      if (IsRunningInPreview) {
        return@Box
      }

      val image = remember {
        val sizePx = with(density) { size.toPx() }.toInt()
        val icon = context.packageManager.getApplicationIcon(context.applicationInfo)
        return@remember if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && icon is AdaptiveIconDrawable) {
          val backgroundDr = icon.background
          val foregroundDr = icon.foreground

          val drr = arrayOfNulls<Drawable>(2)
          drr[0] = backgroundDr
          drr[1] = foregroundDr

          val layerDrawable = LayerDrawable(drr)
          val sizePx = with(density) { size.toPx() }.toInt()
          layerDrawable
            .toBitmap(
              width = sizePx,
              height = sizePx
            )
            .asImageBitmap()
        } else if (icon is BitmapDrawable) {
          icon.bitmap.asImageBitmap()
        } else {
          icon
            .toBitmap(
              width = sizePx,
              height = sizePx
            )
            .asImageBitmap()
        }
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
