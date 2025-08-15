package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Dialog
import com.composables.core.DialogPanel
import com.composables.core.DialogState
import com.composables.core.Scrim
import com.composables.core.rememberDialogState
import com.composeunstyled.Button
import com.composeunstyled.Text
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AppLoadingErrorDialog(
  dialogState: DialogState,
  currentError: String?
) {
  Dialog(state = dialogState) {
    Scrim()

    DialogPanel(
      modifier = Modifier
        .displayCutoutPadding()
        .systemBarsPadding()
        .padding(horizontal = Theme.spacing.medium)
        .clip(RoundedCornerShape(12.dp))
        .background(Theme.colors.background.default)
    ) {
      Column {
        RowLayout(
          rightComponent = {
            Button(onClick = {
              dialogState.visible = false
            }) {
              DayNighIcon(
                id = R.drawable.x_icon,
                contentDescription = "Close dialog"
              )
            }
          },
          modifier = Modifier.padding(Theme.spacing.medium)
        ) {
          Heading("Error loading app")
        }

        Divider()

        Row(modifier = Modifier.padding(Theme.spacing.medium)) {
          Text(currentError ?: "No error message available.")
        }
      }
    }
  }
}

@Preview
@Composable
fun AppLoadingErrorDialogPreview() {
  val dialogState = rememberDialogState(initiallyVisible = true)

  AppLoadingErrorDialog(
    dialogState = dialogState,
    currentError = "An error occurred while loading the app."
  )
}
