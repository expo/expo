package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import com.composables.core.ModalBottomSheet
import com.composables.core.ModalBottomSheetState
import com.composables.core.Scrim
import com.composables.core.Sheet
import com.composables.core.SheetDetent
import com.composables.core.SheetDetent.Companion.Hidden
import com.composables.core.rememberModalBottomSheetState
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Surface

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
fun BottomSheetScaffold(
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
      modifier = Modifier
        .fillMaxWidth()
        .clip(
          RoundedCornerShape(
            topStart = NewAppTheme.borderRadius.xxxl,
            topEnd = NewAppTheme.borderRadius.xxxl
          )
        )
        .background(NewAppTheme.colors.background.default)
    ) {
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
          .fillMaxWidth()
          .navigationBarsPadding()
      ) {
        Box(modifier = Modifier.padding(NewAppTheme.spacing.`4`)) {
          header()
        }

        Surface(
          color = NewAppTheme.colors.background.default,
          modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(scrollState)
        ) {
          Box(
            modifier = Modifier
              .padding(horizontal = NewAppTheme.spacing.`4`)
          ) {
            content()
          }
        }
      }
    }
  }
}
