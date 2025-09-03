package expo.modules.ui.button

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import java.io.Serializable
import expo.modules.kotlin.types.Enumerable
import expo.modules.ui.DynamicTheme
import expo.modules.ui.ExpoModifier
import expo.modules.ui.compose
import expo.modules.ui.fromExpoModifiers
import expo.modules.ui.getImageVector

open class ButtonPressedEvent() : Record, Serializable

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
  val elementColors: MutableState<ButtonColors> = mutableStateOf(ButtonColors()),
  val leadingIcon: MutableState<String?> = mutableStateOf(null),
  val trailingIcon: MutableState<String?> = mutableStateOf(null),
  val disabled: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@Composable
fun StyledButton(variant: ButtonVariant, colors: ButtonColors, disabled: Boolean, onPress: () -> Unit, modifier: Modifier = Modifier, content: @Composable (RowScope.() -> Unit)) {
  when (variant) {
    ButtonVariant.BORDERED -> FilledTonalButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.filledTonalButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      modifier = modifier
    )

    ButtonVariant.BORDERLESS -> TextButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.textButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      modifier = modifier
    )

    ButtonVariant.OUTLINED -> OutlinedButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.outlinedButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      modifier = modifier
    )

    ButtonVariant.ELEVATED -> ElevatedButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.elevatedButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      modifier = modifier
    )

    else -> androidx.compose.material3.Button(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.buttonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      modifier = modifier
    )
  }
}

class Button(context: Context, appContext: AppContext) :
  ExpoComposeView<ButtonProps>(context, appContext, withHostingView = true) {
  override val props = ButtonProps()
  private val onButtonPressed by EventDispatcher<ButtonPressedEvent>()

  init {
    clipToPadding = false // needed for elevated buttons to work
    clipChildren = false
  }

  @Composable
  override fun Content(modifier: Modifier) {
    val (variant) = props.variant
    val (text) = props.text
    val (colors) = props.elementColors
    val (leadingIcon) = props.leadingIcon
    val (trailingIcon) = props.trailingIcon
    val (disabled) = props.disabled
    DynamicTheme {
      StyledButton(
        variant ?: ButtonVariant.DEFAULT,
        colors,
        disabled,
        onPress = { onButtonPressed.invoke(ButtonPressedEvent()) },
        modifier = Modifier.fromExpoModifiers(props.modifiers.value)
      ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          leadingIcon?.let { iconName ->
            getImageVector(iconName)?.let {
              Icon(
                it,
                contentDescription = iconName,
                modifier = Modifier.padding(end = 8.dp)
              )
            }
          }
          
          Text(text)
          
          trailingIcon?.let { iconName ->
            getImageVector(iconName)?.let {
              Icon(
                it,
                contentDescription = iconName,
                modifier = Modifier.padding(start = 8.dp)
              )
            }
          }
        }
      }
    }
  }
}
