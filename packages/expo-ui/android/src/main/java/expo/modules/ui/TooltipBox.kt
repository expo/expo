package expo.modules.ui

import android.content.Context
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf

data class TooltipBoxProps(
  val text: MutableState<String> = mutableStateOf(""),
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
class TooltipBox(context: Context, appContext: AppContext) :
  ExpoComposeView<TooltipBoxProps>(context, appContext) {
  override val props = TooltipBoxProps()

  @Composable
  override fun Content(modifier: Modifier) {
    TooltipBox(
      positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
      tooltip = { PlainTooltip { Text(props.text.value) } },
      state = rememberTooltipState(),
      modifier = modifier
    ) {
      Children()
    }
  }
}
