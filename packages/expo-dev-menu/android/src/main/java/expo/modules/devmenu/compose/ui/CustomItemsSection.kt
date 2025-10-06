package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun CustomItemsSection(
  items: List<DevMenuState.CustomItem>,
  onItemClick: (DevMenuState.CustomItem) -> Unit
) {
  Section.Header("CUSTOM MENU ITEMS")

  Spacer(NewAppTheme.spacing.`3`)

  Column(verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)) {
    items.forEach { item ->
      NewMenuButton(
        content = {
          NewText(text = item.name)
        },
        onClick = { onItemClick(item) }
      )
    }
  }
}
