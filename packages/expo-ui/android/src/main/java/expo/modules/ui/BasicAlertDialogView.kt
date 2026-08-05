package expo.modules.ui

import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.ui.window.DialogProperties
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class BasicAlertDialogProps(
  val properties: ExpoDialogProperties = ExpoDialogProperties(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.BasicAlertDialogContent(
  props: BasicAlertDialogProps,
  onDismissRequest: () -> Unit
) {
  BasicAlertDialog(
    onDismissRequest = { onDismissRequest() },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    properties = DialogProperties(
      dismissOnBackPress = props.properties.dismissOnBackPress,
      dismissOnClickOutside = props.properties.dismissOnClickOutside,
      usePlatformDefaultWidth = props.properties.usePlatformDefaultWidth,
      decorFitsSystemWindows = props.properties.decorFitsSystemWindows
    )
  ) {
    Children(UIComposableScope())
  }
}
