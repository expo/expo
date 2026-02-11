package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class TextInputProps(
  val defaultValue: MutableState<String> = mutableStateOf(""),
  val placeholder: MutableState<String> = mutableStateOf(""),
  val multiline: MutableState<Boolean> = mutableStateOf(false),
  val numberOfLines: MutableState<Int?> = mutableStateOf(null),
  val keyboardType: MutableState<String> = mutableStateOf("default"),
  val autocorrection: MutableState<Boolean> = mutableStateOf(true),
  val autoCapitalize: MutableState<String> = mutableStateOf("none"),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

private fun String.keyboardType(): KeyboardType {
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

private fun String.autoCapitalize(): KeyboardCapitalization {
  return when (this) {
    "characters" -> KeyboardCapitalization.Characters
    "none" -> KeyboardCapitalization.None
    "sentences" -> KeyboardCapitalization.Sentences
    "unspecified" -> KeyboardCapitalization.Unspecified
    "words" -> KeyboardCapitalization.Words
    else -> KeyboardCapitalization.None
  }
}

class TextInputView(context: Context, appContext: AppContext) :
  ExpoComposeView<TextInputProps>(context, appContext) {
  override val props = TextInputProps()
  private val onValueChanged by EventDispatcher()

  private val textState = mutableStateOf<String?>(null)

  var text: String?
    get() = textState.value
    set(value) {
      textState.value = value
      onValueChanged(mapOf("value" to (value ?: "")))
    }

  @Composable
  override fun ComposableScope.Content() {
    TextField(
      value = requireNotNull(textState.value),
      onValueChange = {
        textState.value = it
        onValueChanged(mapOf("value" to it))
      },
      placeholder = { Text(props.placeholder.value) },
      maxLines = if (props.multiline.value) props.numberOfLines.value ?: Int.MAX_VALUE else 1,
      singleLine = !props.multiline.value,
      keyboardOptions = KeyboardOptions.Default.copy(
        keyboardType = props.keyboardType.value.keyboardType(),
        autoCorrectEnabled = props.autocorrection.value,
        capitalization = props.autoCapitalize.value.autoCapitalize()
      ),
      modifier = ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content)
    )
  }
}
