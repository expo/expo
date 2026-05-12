package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.core.utilities.VRUtilities
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
            text = "Toggle performance monitor"
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
            text = "Toggle element inspector"
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
          MenuIcons.Code(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.tertiary
          )
        },
        content = {
          NewText(
            text = "Open DevTools"
          )
        },
        onClick = {
          onAction(DevMenuAction.OpenJSDebugger)
        }
      )

      // TODO(@lukmccall): Re-enable when toggling fast refresh is not longer crashing app
//      Divider(thickness = 0.5.dp)
//
//      NewMenuButton(
//        withSurface = false,
//        icon = {
//          MenuIcons.Refresh(
//            size = 20.dp,
//            tint = NewAppTheme.colors.icon.tertiary
//          )
//        },
//        content = {
//          NewText(
//            text = "Fast Refresh"
//          )
//        },
//        rightComponent = {
//          ToggleSwitch(
//            isToggled = devToolsSettings.isHotLoadingEnabled
//          )
//        },
//        onClick = {
//          onAction(DevMenuAction.ToggleFastRefresh(!devToolsSettings.isHotLoadingEnabled))
//        }
//      )

      // Hide FAB toggle on Quest devices since FAB is always on there
      if (!VRUtilities.isQuest()) {
        Divider(thickness = 0.5.dp)

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
              text = "Tools button"
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
}
