package expo.modules.devlauncher.compose.ui

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.composables.core.ModalBottomSheet
import com.composables.core.ModalBottomSheetState
import com.composables.core.Scrim
import com.composables.core.Sheet
import com.composables.core.SheetDetent
import com.composables.core.SheetDetent.Companion.Hidden
import com.composables.core.rememberModalBottomSheetState
import expo.modules.devmenu.compose.newtheme.NewAppTheme

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
      Column(
        modifier = Modifier
          .clip(
            RoundedCornerShape(
              topStart = NewAppTheme.borderRadius.xxxl,
              topEnd = NewAppTheme.borderRadius.xxxl
            )
          )
          .background(NewAppTheme.colors.background.default)
          .navigationBarsPadding()
          .padding(horizontal = NewAppTheme.spacing.`4`)
          .padding(bottom = NewAppTheme.spacing.`4`)
      ) {
        Row(
          horizontalArrangement = Arrangement.Center,
          modifier = Modifier
            .fillMaxWidth()
            .padding(
              top = NewAppTheme.spacing.`2`,
              bottom = NewAppTheme.spacing.`4`
            )
        ) {
          Box(
            modifier = Modifier
              .size(width = 60.dp, height = 5.dp)
              .background(
                NewAppTheme.colors.border.secondary,
                shape = RoundedCornerShape(size = 5.dp)
              )
          )
        }
        content()
      }
    }
  }
}
