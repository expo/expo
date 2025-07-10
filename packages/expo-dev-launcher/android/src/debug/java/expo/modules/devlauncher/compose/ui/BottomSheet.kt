package expo.modules.devlauncher.compose.ui

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.runtime.Composable
import com.composables.core.ModalBottomSheet
import com.composables.core.ModalBottomSheetState
import com.composables.core.Scrim
import com.composables.core.Sheet
import com.composables.core.SheetDetent
import com.composables.core.SheetDetent.Companion.Hidden
import com.composables.core.rememberModalBottomSheetState
import expo.modules.devlauncher.compose.DefaultScreenContainer

val Full = SheetDetent(identifier = "full") { containerHeight, sheetHeight ->
  containerHeight * 0.90f
}

@Composable
fun rememberBottomSheetState() = rememberModalBottomSheetState(
  initialDetent = Hidden,
  detents = listOf(Hidden, Full)
)

@Composable
fun BottomSheet(
  state: ModalBottomSheetState,
  onDismiss: () -> Unit = {},
  content: @Composable () -> Unit
) {
  ModalBottomSheet(
    state = state,
    onDismiss = onDismiss
  ) {
    Scrim(
      enter = fadeIn(animationSpec = tween(durationMillis = 300))
    )
    Sheet {
      DefaultScreenContainer {
        content()
      }
    }
  }
}
