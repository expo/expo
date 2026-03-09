@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FilledIconToggleButton
import androidx.compose.material3.IconToggleButton
import androidx.compose.material3.OutlinedIconToggleButton
import androidx.compose.material3.Text
import androidx.compose.material3.ToggleButton
import androidx.compose.material3.ToggleButtonDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ToggleButtonProps(
  val checked: Boolean = false,
  val text: String? = null,
  val variant: String = "default",
  val color: Color? = null,
  val disabled: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

data class ToggleButtonValueChangeEvent(
  @Field val checked: Boolean = false
) : Record

@Composable
fun FunctionalComposableScope.ToggleButtonContent(
  props: ToggleButtonProps,
  onCheckedChange: (ToggleButtonValueChangeEvent) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val scope = this

  val content: @Composable () -> Unit = {
    when {
      props.text != null -> Text(text = props.text)
      else -> scope.Children(composableScope)
    }
  }

  // RowScope content for ToggleButton
  val rowContent: @Composable RowScope.() -> Unit = {
    when {
      props.text != null -> Text(text = props.text)
      else -> scope.Children(composableScope)
    }
  }

  when (props.variant) {
    "icon" -> {
      IconToggleButton(
        checked = props.checked,
        onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
        enabled = !props.disabled,
        modifier = modifier,
        content = content
      )
    }
    "filledIcon" -> {
      FilledIconToggleButton(
        checked = props.checked,
        onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
        enabled = !props.disabled,
        modifier = modifier,
        content = content
      )
    }
    "outlinedIcon" -> {
      OutlinedIconToggleButton(
        checked = props.checked,
        onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
        enabled = !props.disabled,
        modifier = modifier,
        content = content
      )
    }
    else -> {
      ToggleButton(
        checked = props.checked,
        onCheckedChange = { onCheckedChange(ToggleButtonValueChangeEvent(it)) },
        enabled = !props.disabled,
        modifier = modifier,
        colors = ToggleButtonDefaults.toggleButtonColors(),
        content = rowContent
      )
    }
  }
}
