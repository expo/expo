package expo.modules.ui

import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback

data class SyncSwitchProps(
  val isOn: ObservableState? = null,
  val onCheckedChangeSync: WorkletCallback? = null,
  val enabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SyncSwitchContent(props: SyncSwitchProps) {
  val state = props.isOn ?: return
  val checked = (state.value as? Boolean) ?: false

  Switch(
    checked = checked,
    onCheckedChange = { newValue ->
      state.value = newValue
      props.onCheckedChangeSync?.invoke(newValue)
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    enabled = props.enabled
  )
}
