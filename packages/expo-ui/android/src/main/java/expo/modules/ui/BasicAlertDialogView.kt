package expo.modules.ui

import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeEventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class BasicAlertDialogProps(
  val modifiers: ModifierList = emptyList(),
  val onDismissRequest: ComposeEventDispatcher<Unit> = ComposeEventDispatcher()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.BasicAlertDialogContent(
  props: BasicAlertDialogProps
) {
  BasicAlertDialog(
    onDismissRequest = { props.onDismissRequest(Unit) },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
