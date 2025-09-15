package expo.modules.ui.menu

import android.content.Context
import android.view.GestureDetector
import android.view.MotionEvent
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
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.ui.DynamicTheme
import expo.modules.ui.ThemedHybridSwitch
import expo.modules.ui.compose
import expo.modules.ui.composeOrNull
import expo.modules.ui.getImageVector

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

class ContextMenu(context: Context, appContext: AppContext) :
  ExpoComposeView<ContextMenuProps>(context, appContext, withHostingView = true) {
  override val props = ContextMenuProps()
  val expanded = mutableStateOf(false)
  val onContextMenuButtonPressed by EventDispatcher<ContextMenuButtonPressedEvent>()
  val onContextMenuSwitchValueChanged by EventDispatcher<ContextMenuSwitchValueChangeEvent>()

  val gestureDetector = GestureDetector(
    context,
    object : GestureDetector.SimpleOnGestureListener() {
      override fun onDown(e: MotionEvent): Boolean {
        if (props.activationMethod.value == ActivationMethod.SINGLE_PRESS) {
          expanded.value = !expanded.value
        }
        return super.onDown(e)
      }

      override fun onLongPress(e: MotionEvent) {
        if (props.activationMethod.value == ActivationMethod.LONG_PRESS) {
          expanded.value = !expanded.value
        }
        return super.onLongPress(e)
      }
    }
  )

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    ev?.let {
      gestureDetector.onTouchEvent(ev)
    }
    return super.dispatchTouchEvent(ev)
  }

  @Composable
  override fun Content(modifier: Modifier) {
    var elements by remember { props.elements }
    val color by remember { props.color }

    return Box {
      DynamicTheme {
        DropdownMenu(
          containerColor = color?.composeOrNull ?: MenuDefaults.containerColor,
          expanded = expanded.value,
          onDismissRequest = {
            expanded.value = !expanded.value
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
}
