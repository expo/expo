package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Dialog
import com.composables.core.DialogPanel
import com.composables.core.DialogState
import com.composables.core.Scrim
import com.composables.core.rememberDialogState
import com.composeunstyled.Button
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeState
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.ui.MenuIcons

@Composable
fun rememberAppLoadingErrorDialogState(state: HomeState, onAction: (HomeAction) -> Unit): DialogState {
  val errorDialogState = rememberDialogState(initiallyVisible = false)
  LaunchedEffect(state.loadingError) {
    if (state.loadingError != null) {
      errorDialogState.visible = true
    }
  }

  LaunchedEffect(errorDialogState.visible) {
    if (!errorDialogState.visible) {
      onAction(HomeAction.ClearLoadingError)
    }
  }
  return errorDialogState
}

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
        .padding(horizontal = NewAppTheme.spacing.`3`)
        .clip(RoundedCornerShape(12.dp))
        .background(NewAppTheme.colors.background.default)
    ) {
      Column {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween,
          modifier = Modifier
            .fillMaxWidth()
            .padding(NewAppTheme.spacing.`3`)
        ) {
          NewText(
            "Error loading app",
            style = NewAppTheme.font.lg.merge(
              fontWeight = FontWeight.SemiBold
            )
          )

          Button(onClick = {
            dialogState.visible = false
          }) {
            MenuIcons.Close(
              size = 20.dp,
              tint = NewAppTheme.colors.icon.tertiary
            )
          }
        }

        Divider()

        Row(modifier = Modifier.padding(NewAppTheme.spacing.`3`)) {
          NewText(currentError ?: "No error message available.")
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
