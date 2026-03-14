@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeEventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ModalBottomSheetProps(
  val skipPartiallyExpanded: Boolean = false,
  val modifiers: ModifierList = emptyList(),
  val onDismissRequest: ComposeEventDispatcher<Unit> = ComposeEventDispatcher()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ModalBottomSheetContent(props: ModalBottomSheetProps) {
  val sheetState = rememberModalBottomSheetState(props.skipPartiallyExpanded)

  ModalBottomSheet(
    sheetState = sheetState,
    onDismissRequest = { props.onDismissRequest(Unit) },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
