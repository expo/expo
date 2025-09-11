package expo.modules.devlauncher.compose.routes

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import com.composables.core.ModalBottomSheetState
import com.composables.core.SheetDetent.Companion.Hidden
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devlauncher.compose.ui.BottomSheet
import expo.modules.devlauncher.compose.ui.DevelopmentSessionHelp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun DevelopmentServersRoute(
  bottomSheetState: ModalBottomSheetState
) {
  BottomSheet(bottomSheetState) {
    Column {
      NewText(
        "Development Servers",
        style = NewAppTheme.font.xxl.merge(
          fontWeight = FontWeight.SemiBold,
          textAlign = TextAlign.Center
        ),
        modifier = Modifier
          .padding(vertical = NewAppTheme.spacing.`4`)
          .fillMaxWidth()
      )

      Spacer(NewAppTheme.spacing.`3`)

      DevelopmentSessionHelp()

      Spacer(NewAppTheme.spacing.`5`)

      ActionButton(
        text = "Dismiss",
        foreground = NewAppTheme.colors.text.secondary,
        background = NewAppTheme.colors.background.element,
        modifier = Modifier.padding(NewAppTheme.spacing.`3`),
        onClick = {
          bottomSheetState.targetDetent = Hidden
        }
      )
    }
  }
}
