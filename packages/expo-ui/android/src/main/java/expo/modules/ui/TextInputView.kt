package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.text.KeyboardOptions

import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView

import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps

import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.input.KeyboardType
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.Direction
import java.util.EnumSet

data class TextInputProps(
  val defaultValue: MutableState<String> = mutableStateOf(""),
  val placeholder: MutableState<String> = mutableStateOf(""),
  val multiline: MutableState<Boolean> = mutableStateOf(false),
  val numberOfLines: MutableState<Int?> = mutableStateOf(null),
  val keyboardType: MutableState<String> = mutableStateOf("default"),
  val autocorrection: MutableState<Boolean> = mutableStateOf(true)
) : ComposeProps

fun String.keyboardType(): KeyboardType {
  return when (this) {
    "default" -> KeyboardType.Text
    "numeric" -> KeyboardType.Number
    "email-address" -> KeyboardType.Email
    "phone-pad" -> KeyboardType.Phone
    "decimal-pad" -> KeyboardType.Decimal
    "password" -> KeyboardType.Password
    "ascii-capable" -> KeyboardType.Ascii
    "url" -> KeyboardType.Uri
    "number-password" -> KeyboardType.NumberPassword
    else -> KeyboardType.Text
  }
}

class TextInputView(context: Context, appContext: AppContext) :
  ExpoComposeView<TextInputProps>(context, appContext, withHostingView = true) {
  override val props = TextInputProps()
  private val onValueChanged by EventDispatcher()

  @Composable
  override fun Content() {
    var value by remember { props.defaultValue }
    AutoSizingComposable(shadowNodeProxy, axis = EnumSet.of(Direction.VERTICAL)) {
      TextField(
        value = value,
        onValueChange = {
          value = it
          onValueChanged(mapOf("value" to it))
        },
        placeholder = { Text(props.placeholder.value) },
        maxLines = if (props.multiline.value) props.numberOfLines.value ?: Int.MAX_VALUE else 1,
        singleLine = !props.multiline.value,
        keyboardOptions = KeyboardOptions.Default.copy(
          keyboardType = props.keyboardType.value.keyboardType(),
          autoCorrectEnabled = props.autocorrection.value
        )
      )
    }
  }
}
