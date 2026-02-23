@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ModalBottomSheetProps(
  val skipPartiallyExpanded: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ModalBottomSheetContent(props: ModalBottomSheetProps, onDismissRequest: () -> Unit) {
  val sheetState = rememberModalBottomSheetState(props.skipPartiallyExpanded)

  ModalBottomSheet(
    sheetState = sheetState,
    onDismissRequest = { onDismissRequest() },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
