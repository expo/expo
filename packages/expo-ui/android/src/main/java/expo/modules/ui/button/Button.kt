package expo.modules.ui.button

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.OutlinedButton
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.types.Enumerable
import expo.modules.ui.DynamicTheme
import expo.modules.ui.convertColor

enum class ButtonVariant(val value: String) : Enumerable {
  DEFAULT("default"),
  BORDERED("bordered"),
  BORDERLESS("borderless"),
  OUTLINED("outlined"),
  ELEVATED("elevated")
}

class ButtonColors : Record {
  @Field
  val containerColor: Color? = null

  @Field
  val contentColor: Color? = null

  @Field
  val disabledContainerColor: Color? = null

  @Field
  val disabledContentColor: Color? = null
}


data class ButtonProps(
  val text: MutableState<String> = mutableStateOf(""),
  val variant: MutableState<ButtonVariant?> = mutableStateOf(ButtonVariant.DEFAULT),
  val colors: MutableState<ButtonColors> = mutableStateOf(ButtonColors())

) : ComposeProps

@Composable
fun StyledButton(variant: ButtonVariant, colors: ButtonColors, onPress: () -> Unit, content: @Composable (RowScope.() -> Unit)) {

  when (variant) {
    ButtonVariant.BORDERED -> FilledTonalButton(onPress, content = content, colors = ButtonDefaults.filledTonalButtonColors(
      containerColor = convertColor(colors.containerColor),
      contentColor = convertColor(colors.contentColor),
      disabledContainerColor = convertColor(colors.disabledContainerColor),
      disabledContentColor = convertColor(colors.disabledContentColor),
    ))

    ButtonVariant.BORDERLESS -> TextButton(onPress, content = content, colors = ButtonDefaults.textButtonColors(
      containerColor = convertColor(colors.containerColor),
      contentColor = convertColor(colors.contentColor),
      disabledContainerColor = convertColor(colors.disabledContainerColor),
      disabledContentColor = convertColor(colors.disabledContentColor),
    ))

    ButtonVariant.OUTLINED -> OutlinedButton(onPress, content = content, colors = ButtonDefaults.outlinedButtonColors(
      containerColor = convertColor(colors.containerColor),
      contentColor = convertColor(colors.contentColor),
      disabledContainerColor = convertColor(colors.disabledContainerColor),
      disabledContentColor = convertColor(colors.disabledContentColor),
    ))

    ButtonVariant.ELEVATED -> ElevatedButton(onPress, content = content, colors = ButtonDefaults.elevatedButtonColors(
      containerColor = convertColor(colors.containerColor),
      contentColor = convertColor(colors.contentColor),
      disabledContainerColor = convertColor(colors.disabledContainerColor),
      disabledContentColor = convertColor(colors.disabledContentColor),
    ))

    else -> androidx.compose.material3.Button(onPress, content = content, colors = ButtonDefaults.buttonColors(
      containerColor = convertColor(colors.containerColor),
      contentColor = convertColor(colors.contentColor),
      disabledContainerColor = convertColor(colors.disabledContainerColor),
      disabledContentColor = convertColor(colors.disabledContentColor),
    ))
  }
}

class Button(context: Context, appContext: AppContext) : ExpoComposeView<ButtonProps>(context, appContext) {
  override val props = ButtonProps()
  private val onButtonPressed by EventDispatcher<Unit>()

  init {
    clipToPadding = false // needed for elevated buttons to work
    clipChildren = false

    setContent {
      val (variant) = props.variant
      val (text) = props.text
      val (colors) = props.colors
      DynamicTheme {
        StyledButton(variant ?: ButtonVariant.DEFAULT, colors,
          { onButtonPressed.invoke(Unit) }) {
          Text(text)
        }
      }
    }
  }
}

