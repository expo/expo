package expo.modules.ui.menu

import android.content.Context
import android.view.GestureDetector
import android.view.MotionEvent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEventCallback

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
fun FlatMenu(elements: Array<ContextMenuElement>, sectionTitle: String?, dispatchers: ContextMenuDispatchers) {
  sectionTitle?.takeIf { !it.isEmpty() }?.let {
    SectionTitle(it)
  }
  elements.forEachIndexed { index, element ->
    val id = element.contextMenuElementID
    element.button?.let {
      DropdownMenuItem(
        text = { Text(it.text) },
        onClick = {
          dispatchers.buttonPressed(ContextMenuButtonPressedEvent(id))
        }
      )
    }

    element.switch?.let {
      DropdownMenuItem(
        text = {
          Row(verticalAlignment = Alignment.CenterVertically) {
            Text(it.label)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
              if (it.variant == "checkbox") {
                Checkbox(
                  checked = it.checked,
                  onCheckedChange = null,
                  modifier = Modifier
                    .padding(horizontal = 5.dp)
                    .wrapContentSize(Alignment.CenterEnd)
                )
              } else {
                Switch(
                  checked = it.checked,
                  onCheckedChange = null,
                  modifier = Modifier
                    .padding(start = 5.dp)
                    .wrapContentSize(Alignment.CenterEnd)
                )
              }
            }
          }
        },
        modifier = Modifier.wrapContentSize(Alignment.Center),
        onClick = {
          dispatchers.switchCheckedChanged(
            ContextMenuSwitchCheckedChangedEvent(!it.checked, id)
          )
        }
      )
    }

    element.submenu?.let {
      HorizontalDivider()
      FlatMenu(it.elements, it.button.text, dispatchers)
    }
  }
}

data class ContextMenuDispatchers(
  val buttonPressed: ViewEventCallback<ContextMenuButtonPressedEvent>,
  val switchCheckedChanged: ViewEventCallback<ContextMenuSwitchCheckedChangedEvent>
)

class ContextMenu(context: Context, appContext: AppContext) : ExpoComposeView<ContextMenuProps>(context, appContext) {
  override val props = ContextMenuProps()
  val expanded = mutableStateOf(false)
  val onContextMenuButtonPressed by EventDispatcher<ContextMenuButtonPressedEvent>()
  val onContextMenuSwitchCheckedChanged by EventDispatcher<ContextMenuSwitchCheckedChangedEvent>()

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

  init {
    setContent {
      var elements by remember { props.elements }

      return@setContent Box {
        DropdownMenu(
          expanded = expanded.value,
          onDismissRequest = { expanded.value = !expanded.value }
        ) {
          FlatMenu(
            elements,
            null,
            dispatchers = ContextMenuDispatchers(
              buttonPressed = onContextMenuButtonPressed,
              switchCheckedChanged = onContextMenuSwitchCheckedChanged
            )
          )
        }
      }
    }
  }
}
