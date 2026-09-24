package expo.modules.devmenu.compose.ui

import android.content.res.Resources
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.core.graphics.drawable.toBitmap
import com.composeunstyled.UnstyledIcon
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun CustomItemsSection(
  items: List<DevMenuState.CustomItem>,
  onItemClick: (DevMenuState.CustomItem) -> Unit
) {
  items.groupBy { it.group }.entries.forEachIndexed { groupIndex, (group, groupItems) ->
    if (groupIndex > 0) {
      Spacer(NewAppTheme.spacing.`5`)
    }
    Section.Header(group ?: "CUSTOM MENU ITEMS")
    Spacer(NewAppTheme.spacing.`3`)

    RoundedSurface {
      Column {
        groupItems.withIndex().forEach { (index, item) ->
          val icon = customItemIcon(item.icon)
          NewMenuButton(
            withSurface = false,
            icon = icon,
            content = { NewText(text = item.name) },
            onClick = { onItemClick(item) }
          )

          if (index < groupItems.size - 1) {
            Divider(thickness = 0.5.dp)
          }
        }
      }
    }
  }
}

@Composable
private fun customItemIcon(name: String?): NewMenuButtonComposable? {
  val context = LocalContext.current
  val configuration = LocalConfiguration.current
  val size = with(LocalDensity.current) { 20.dp.roundToPx() }
  val painter = remember(context, configuration, name, size) {
    try {
      name?.let { ResourceDrawableIdHelper.getResourceDrawable(context, it) }
        ?.let { BitmapPainter(it.toBitmap(size, size).asImageBitmap()) }
    } catch (_: Resources.NotFoundException) {
      null
    }
  } ?: return null

  return {
    UnstyledIcon(
      painter = painter,
      contentDescription = null,
      tint = NewAppTheme.colors.icon.tertiary,
      modifier = Modifier.size(20.dp)
    )
  }
}
