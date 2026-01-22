package expo.modules.ui.menu

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuDefaults
import androidx.compose.material3.MenuItemColors
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.ThemedHybridSwitch
import expo.modules.ui.compose
import expo.modules.ui.composeOrNull
import expo.modules.ui.getImageVector

/**
 * CompositionLocal that allows child composables (like Button) to trigger ContextMenu expansion.
 * When a Button is inside a ContextMenu, it can use this to open the menu on click.
 */
val LocalContextMenuExpanded = compositionLocalOf<MutableState<Boolean>?> { null }

@Composable
private fun SectionTitle(text: String) {
  Text(
    text = text,
    style = MaterialTheme.typography.labelSmall,
    color = MaterialTheme.colorScheme.onSurfaceVariant,
    modifier = Modifier
      .fillMaxWidth()
      .padding(start = 16.dp, top = 8.dp, end = 16.dp, bottom = 4.dp)
  )
}

@Composable
fun FlatMenu(elements: Array<ContextMenuElement>, sectionTitle: String?, dispatchers: ContextMenuDispatchers, expanded: MutableState<Boolean>) {
  sectionTitle?.takeIf { !it.isEmpty() }?.let {
    SectionTitle(it)
  }
  elements.forEachIndexed { index, element ->
    val id = element.contextMenuElementID
    element.button?.let {
      DropdownMenuItem(
        colors = MenuItemColors(
          textColor = it.elementColors.contentColor.compose,
          leadingIconColor = it.elementColors.contentColor.compose,
          trailingIconColor = it.elementColors.contentColor.compose,
          disabledTextColor = it.elementColors.disabledContentColor.compose,
          disabledLeadingIconColor = it.elementColors.disabledContentColor.compose,
          disabledTrailingIconColor = it.elementColors.disabledContentColor.compose
        ),
        enabled = !it.disabled,
        modifier = Modifier.background(it.elementColors.containerColor.compose),
        text = { Text(it.text) },
        leadingIcon = it.leadingIcon?.let { iconName ->
          {
            getImageVector(iconName)?.let { imageVector ->
              Icon(
                imageVector = imageVector,
                contentDescription = iconName
              )
            }
          }
        },
        trailingIcon = it.trailingIcon?.let { iconName ->
          {
            getImageVector(iconName)?.let { imageVector ->
              Icon(
                imageVector = imageVector,
                contentDescription = iconName
              )
            }
          }
        },
        onClick = {
          dispatchers.buttonPressed(ContextMenuButtonPressedEvent(id))
          expanded.value = false
        }
      )
    }

    element.switch?.let {
      DropdownMenuItem(
        text = {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Text(it.label)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
              ThemedHybridSwitch(
                variant = it.variant,
                checked = it.value,
                onCheckedChange = null,
                colors = it.elementColors,
                modifier = Modifier
                  .padding(horizontal = 5.dp)
                  .wrapContentSize(Alignment.CenterEnd)
              )
            }
          }
        },
        modifier = Modifier.wrapContentSize(Alignment.Center),
        onClick = {
          dispatchers.switchCheckedChanged(
            ContextMenuSwitchValueChangeEvent(!it.value, id)
          )
          expanded.value = false
        }
      )
    }

    element.submenu?.let {
      HorizontalDivider()
      FlatMenu(it.elements, it.button.text, dispatchers, expanded)
    }
  }
}

data class ContextMenuDispatchers(
  val buttonPressed: ViewEventCallback<ContextMenuButtonPressedEvent>,
  val switchCheckedChanged: ViewEventCallback<ContextMenuSwitchValueChangeEvent>
)

@Composable
fun FunctionalComposableScope.ContextMenuContent(
  props: ContextMenuProps,
  onContextMenuButtonPressed: (ContextMenuButtonPressedEvent) -> Unit,
  onContextMenuSwitchValueChanged: (ContextMenuSwitchValueChangeEvent) -> Unit,
  onExpandedChanged: (ExpandedChangedEvent) -> Unit
) {
  val expanded = remember { mutableStateOf(false) }
  val elements = props.elements
  val color = props.color

  // Provide expanded state to children via CompositionLocal
  // This allows Button children to trigger menu expansion
  CompositionLocalProvider(LocalContextMenuExpanded provides expanded) {
    Box(modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)) {
      // Trigger button - Button will automatically expand menu when clicked
      Children(ComposableScope())

      DropdownMenu(
        containerColor = color?.composeOrNull ?: MenuDefaults.containerColor,
        expanded = expanded.value,
        onDismissRequest = {
          expanded.value = false
          onExpandedChanged(ExpandedChangedEvent(false))
        }
      ) {
        FlatMenu(
          elements,
          null,
          dispatchers = ContextMenuDispatchers(
            buttonPressed = onContextMenuButtonPressed,
            switchCheckedChanged = onContextMenuSwitchValueChanged
          ),
          expanded = expanded
        )
      }
    }
  }
}

data class ExpandedChangedEvent(
  @expo.modules.kotlin.records.Field val expanded: Boolean
) : expo.modules.kotlin.records.Record
