package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer

/**
 * Full sub-screen listing every component registered with `AppRegistry`
 */
@Composable
fun ComponentsScreen(
  appKeys: List<String>,
  currentAppKey: String?,
  onAction: DevMenuActionHandler
) {
  Column {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
    ) {
      Button(
        onClick = { onAction(DevMenuAction.CloseSubScreen) },
        shape = RoundedCornerShape(NewAppTheme.borderRadius.full),
        backgroundColor = NewAppTheme.colors.background.element,
        modifier = Modifier.size(36.dp)
      ) {
        MenuIcons.ArrowBack(
          size = 16.dp,
          tint = NewAppTheme.colors.icon.tertiary
        )
      }
      NewText(
        text = "Components",
        style = NewAppTheme.font.lg.merge(fontWeight = FontWeight.SemiBold)
      )
    }

    Spacer(NewAppTheme.spacing.`5`)

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
              {
                MenuIcons.Check(
                  size = 16.dp,
                  tint = NewAppTheme.colors.icon.default
                )
              }
            } else {
              null
            },
            onClick = {
              if (!isCurrent) {
                onAction(DevMenuAction.SwitchComponent(name))
              }
            }
          )

          if (index < appKeys.size - 1) {
            Divider(thickness = 0.5.dp)
          }
        }
      }
    }
  }
}
