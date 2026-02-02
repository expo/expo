package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import java.io.Serializable

open class IsOpenedChangeEvent(
  @Field open val isOpened: Boolean = false
) : Record, Serializable

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetComposable(skipPartiallyExpanded: Boolean, isOpened: Boolean, onIsOpenedChange: (Boolean) -> Unit, content: @Composable () -> Unit) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded)

  if (isOpened) {
    ModalBottomSheet(
      sheetState = sheetState,
      modifier = Modifier.fillMaxHeight(),
      onDismissRequest = { onIsOpenedChange(false) }
    ) {
      content()
    }
  }
}

data class BottomSheetProps(
  val isOpened: Boolean = false,
  val skipPartiallyExpanded: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.BottomSheetContent(props: BottomSheetProps, onIsOpenedChange: (IsOpenedChangeEvent) -> Unit) {
  Box {
    BottomSheetComposable(
      props.skipPartiallyExpanded,
      props.isOpened,
      onIsOpenedChange = { value -> onIsOpenedChange(IsOpenedChangeEvent(value)) }
    ) {
      Children(ComposableScope())
    }
  }
}
