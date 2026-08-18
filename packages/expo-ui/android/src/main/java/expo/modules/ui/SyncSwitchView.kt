package expo.modules.ui

import androidx.compose.material3.Switch
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class SyncSwitchProps(
  val isOn: ObservableState? = null,
  val onCheckedChangeSync: WorkletCallback? = null,
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
      props.onCheckedChangeSync?.invoke(newValue)
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
