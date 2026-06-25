package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.appwidget.RadioButton
import expo.modules.ui.RadioButtonProps

@Composable
fun RadioButtonView(props: RadioButtonProps) {
  RadioButton(
    checked = props.selected,
    onClick = null,
    modifier = props.modifiers.toGlanceModifier(),
    enabled = props.clickable
  )
}
