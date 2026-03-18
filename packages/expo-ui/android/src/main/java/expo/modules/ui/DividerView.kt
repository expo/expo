package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.DividerDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.VerticalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class HorizontalDividerProps(
  val thickness: Float? = null,
  val color: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.HorizontalDividerContent(props: HorizontalDividerProps) {
  HorizontalDivider(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    thickness = props.thickness?.dp ?: DividerDefaults.Thickness,
    color = props.color.composeOrNull ?: DividerDefaults.color
  )
}

data class VerticalDividerProps(
  val thickness: Float? = null,
  val color: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.VerticalDividerContent(props: VerticalDividerProps) {
  VerticalDivider(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    thickness = props.thickness?.dp ?: DividerDefaults.Thickness,
    color = props.color.composeOrNull ?: DividerDefaults.color
  )
}
