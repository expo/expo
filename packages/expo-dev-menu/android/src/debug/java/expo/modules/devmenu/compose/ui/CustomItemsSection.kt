package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
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
  Section.Header("CUSTOM MENU ITEMS")

  Spacer(NewAppTheme.spacing.`3`)

  RoundedSurface {
    Column {
      items.withIndex().forEach { (index, item) ->
        NewMenuButton(
          withSurface = false,
          content = {
            NewText(text = item.name)
          },
          onClick = { onItemClick(item) }
        )

        if (index < items.size - 1) {
          Divider(thickness = 0.5.dp)
        }
      }
    }
  }
}
