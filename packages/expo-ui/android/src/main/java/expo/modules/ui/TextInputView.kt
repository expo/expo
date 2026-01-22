package expo.modules.ui

import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class TextInputProps(
  val defaultValue: String = "",
  val placeholder: String = "",
  val multiline: Boolean = false,
  val numberOfLines: Int? = null,
  val keyboardType: String = "default",
  val autocorrection: Boolean = true,
  val autoCapitalize: String = "none",
  val modifiers: ModifierList = emptyList()
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

data class TextValueChangedEvent(
  @Field val value: String
) : Record

object TextInputFunctions {
  const val SET_TEXT = "setText"
}

@Composable
fun FunctionalComposableScope.TextInputContent(
  props: TextInputProps,
  onValueChanged: (TextValueChangedEvent) -> Unit
) {
  var value by remember { mutableStateOf(props.defaultValue) }

  // Register imperative handler
  ImperativeHandler(TextInputFunctions.SET_TEXT) { text: String ->
    value = text
    onValueChanged(TextValueChangedEvent(text))
  }

  TextField(
    value = value,
    onValueChange = {
      value = it
      onValueChanged(TextValueChangedEvent(value))
    },
    placeholder = { Text(props.placeholder) },
    maxLines = if (props.multiline) props.numberOfLines ?: Int.MAX_VALUE else 1,
    singleLine = !props.multiline,
    keyboardOptions = KeyboardOptions.Default.copy(
      keyboardType = props.keyboardType.keyboardType(),
      autoCorrectEnabled = props.autocorrection,
      capitalization = props.autoCapitalize.autoCapitalize()
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
  )
}
