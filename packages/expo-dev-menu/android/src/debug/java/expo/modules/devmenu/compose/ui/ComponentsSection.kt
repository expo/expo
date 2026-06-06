package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun ComponentsSection(
  appKeys: List<String>,
  currentAppKey: String?,
  onSelect: (String) -> Unit
) {
  Section.Header("COMPONENTS")

  Spacer(NewAppTheme.spacing.`3`)

  RoundedSurface {
    Column {
      appKeys.withIndex().forEach { (index, name) ->
        val isCurrent = name == currentAppKey
        NewMenuButton(
          withSurface = false,
          enabled = !isCurrent,
          content = {
            NewText(text = name)
          },
          rightComponent = if (isCurrent) {
            { NewText(text = "current") }
          } else {
            null
          },
          onClick = { if (!isCurrent) onSelect(name) }
        )

        if (index < appKeys.size - 1) {
          Divider(thickness = 0.5.dp)
        }
      }
    }
  }
}
