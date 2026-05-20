package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.layout.Spacer
import expo.modules.ui.SpacerProps as ExpoSpacerProps

typealias SpacerProps = ExpoSpacerProps

@Composable
fun SpacerView(props: SpacerProps) {
  Spacer(modifier = props.modifiers.toGlanceModifier())
}
