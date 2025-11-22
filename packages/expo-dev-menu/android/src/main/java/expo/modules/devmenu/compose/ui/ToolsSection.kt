package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.DevToolsSettings
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.ToggleSwitch

@Composable
fun ToolsSection(
  onAction: DevMenuActionHandler,
  devToolsSettings: DevToolsSettings,
  showFab: Boolean
) {
  Section.Header(
    "TOOLS"
  )

  Spacer(NewAppTheme.spacing.`3`)

  RoundedSurface {
    Column {
      NewMenuButton(
        withSurface = false,
        icon = {
          MenuIcons.Performance(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.tertiary
          )
        },
        content = {
          NewText(
            text = "Performance monitor"
          )
        },
        onClick = {
          onAction(DevMenuAction.TogglePerformanceMonitor)
        }
      )

      Divider(thickness = 0.5.dp)

      NewMenuButton(
        withSurface = false,
        icon = {
          MenuIcons.Inspect(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.tertiary
          )
        },
        content = {
          NewText(
            text = "Element inspector"
          )
        },
        onClick = {
          onAction(DevMenuAction.ToggleElementInspector)
        }
      )

      Divider(thickness = 0.5.dp)

      NewMenuButton(
        withSurface = false,
        icon = {
          MenuIcons.Bug(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.tertiary
          )
        },
        content = {
          NewText(
            text = "JS debugger"
          )
        },
        onClick = {
          onAction(DevMenuAction.OpenJSDebugger)
        }
      )

      Divider(thickness = 0.5.dp)

      NewMenuButton(
        withSurface = false,
        icon = {
          MenuIcons.Refresh(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.tertiary
          )
        },
        content = {
          NewText(
            text = "Fast Refresh"
          )
        },
        rightComponent = {
          ToggleSwitch(
            isToggled = devToolsSettings.isHotLoadingEnabled
          )
        },
        onClick = {
          onAction(DevMenuAction.ToggleFastRefresh(!devToolsSettings.isHotLoadingEnabled))
        }
      )

      Divider(color = NewAppTheme.colors.border.default)

      NewMenuButton(
        withSurface = false,
        icon = {
          MenuIcons.Fab(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.tertiary
          )
        },
        content = {
          NewText(
            text = "Action button"
          )
        },
        rightComponent = {
          ToggleSwitch(
            isToggled = showFab
          )
        },
        onClick = {
          onAction(DevMenuAction.ToggleFab)
        }
      )
    }
  }
}
