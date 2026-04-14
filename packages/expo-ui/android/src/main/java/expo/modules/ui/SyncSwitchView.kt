package expo.modules.ui

import androidx.compose.material3.Switch
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.state.ObservableState

data class SyncSwitchProps(
  val isOn: ObservableState? = null,
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SyncSwitchContent(props: SyncSwitchProps) {
  val state = props.isOn ?: return

  Switch(
    checked = state.binding(false),
    onCheckedChange = { newValue ->
      state.value = newValue
    },
    modifier = ModifierRegistry.applyModifiers(
      props.modifiers,
      appContext,
      composableScope,
      globalEventDispatcher
    ),
    enabled = props.enabled
  )
}
