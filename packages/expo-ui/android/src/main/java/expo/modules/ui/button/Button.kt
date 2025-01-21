package expo.modules.ui.button

import android.content.Context
import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.OutlinedButton
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps

enum class ButtonStyle(val value: String) {
  DEFAULT("default"),
  BORDERED("bordered"),
  BORDERLESS("borderless"),
  OUTLINED("outlined"),
  ELEVATED("elevated")
}

data class ButtonProps(
  val text: MutableState<String> = mutableStateOf(""),
  val buttonStyle: MutableState<ButtonStyle?> = mutableStateOf(ButtonStyle.DEFAULT)
) : ComposeProps

@Composable
fun StyledButton(style: ButtonStyle, onPress: () -> Unit, content: @Composable (RowScope.() -> Unit)) {
  when (style) {
    ButtonStyle.DEFAULT -> androidx.compose.material3.Button(onPress, content = content)
    ButtonStyle.BORDERED -> FilledTonalButton(onPress, content = content)
    ButtonStyle.BORDERLESS -> TextButton(onPress, content = content)
    ButtonStyle.OUTLINED -> OutlinedButton(onPress, content = content)
    ButtonStyle.ELEVATED -> ElevatedButton(onPress, content = content)
    else -> androidx.compose.material3.Button(onPress, content = content)
  }
}

class Button(context: Context, appContext: AppContext) : ExpoComposeView<ButtonProps>(context, appContext) {
  override val props = ButtonProps()
  private val onButtonPressed by EventDispatcher<Unit>()

  init {
    setContent {
      val buttonStyle by remember { props.buttonStyle }
      val text by remember { props.text }
      StyledButton(buttonStyle ?: ButtonStyle.DEFAULT, { onButtonPressed.invoke(Unit) }) {
        Text(text)
      }
    }
  }
}
