package expo.modules.devmenu.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.composables.core.ModalBottomSheet
import com.composables.core.ModalBottomSheetState
import com.composables.core.Scrim
import com.composables.core.Sheet
import com.composables.core.SheetDetent
import com.composables.core.SheetDetent.Companion.Hidden
import com.composables.core.rememberModalBottomSheetState
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Surface
import expo.modules.devmenu.compose.theme.Theme

val Peek = SheetDetent(identifier = "peek") { containerHeight, sheetHeight ->
  containerHeight * 0.6f
}

val Full = SheetDetent(identifier = "full") { containerHeight, sheetHeight ->
  containerHeight * 0.95f
}

@Composable
fun rememberBottomSheetState() = rememberModalBottomSheetState(
  initialDetent = Hidden,
  detents = listOf(Hidden, Peek, Full)
)

@Composable
fun BottomSheet(
  state: ModalBottomSheetState,
  onDismiss: () -> Unit = {},
  header: @Composable () -> Unit = {},
  content: @Composable () -> Unit
) {
  val scrollState = rememberScrollState()

  ModalBottomSheet(
    state = state,
    onDismiss = onDismiss
  ) {
    Scrim()
    Sheet(
      modifier = Modifier.fillMaxWidth()
    ) {
      Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
      ) {
        Divider()

        header()

        Divider()

        Surface(
          color = Theme.colors.background.secondary,
          modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(scrollState)
        ) {
          content()
        }
      }
    }
  }
}
