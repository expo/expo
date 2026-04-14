package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldColors
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.focus.FocusManager
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

// region Records

enum class TextFieldVariant(val value: String) : Enumerable {
  FILLED("filled"),
  OUTLINED("outlined"),
}

data class TextFieldKeyboardOptionsRecord(
  @Field val capitalization: String? = null,
  @Field val autoCorrectEnabled: Boolean? = null,
  @Field val keyboardType: String? = null,
  @Field val imeAction: String? = null,
) : Record

data class TextFieldColorsRecord(
  // Text
  @Field val focusedTextColor: Color? = null,
  @Field val unfocusedTextColor: Color? = null,
  @Field val disabledTextColor: Color? = null,
  @Field val errorTextColor: Color? = null,
  // Container
  @Field val focusedContainerColor: Color? = null,
  @Field val unfocusedContainerColor: Color? = null,
  @Field val disabledContainerColor: Color? = null,
  @Field val errorContainerColor: Color? = null,
  // Cursor
  @Field val cursorColor: Color? = null,
  @Field val errorCursorColor: Color? = null,
  // Indicator
  @Field val focusedIndicatorColor: Color? = null,
  @Field val unfocusedIndicatorColor: Color? = null,
  @Field val disabledIndicatorColor: Color? = null,
  @Field val errorIndicatorColor: Color? = null,
  // Leading icon
  @Field val focusedLeadingIconColor: Color? = null,
  @Field val unfocusedLeadingIconColor: Color? = null,
  @Field val disabledLeadingIconColor: Color? = null,
  @Field val errorLeadingIconColor: Color? = null,
  // Trailing icon
  @Field val focusedTrailingIconColor: Color? = null,
  @Field val unfocusedTrailingIconColor: Color? = null,
  @Field val disabledTrailingIconColor: Color? = null,
  @Field val errorTrailingIconColor: Color? = null,
  // Label
  @Field val focusedLabelColor: Color? = null,
  @Field val unfocusedLabelColor: Color? = null,
  @Field val disabledLabelColor: Color? = null,
  @Field val errorLabelColor: Color? = null,
  // Placeholder
  @Field val focusedPlaceholderColor: Color? = null,
  @Field val unfocusedPlaceholderColor: Color? = null,
  @Field val disabledPlaceholderColor: Color? = null,
  @Field val errorPlaceholderColor: Color? = null,
  // Supporting text
  @Field val focusedSupportingTextColor: Color? = null,
  @Field val unfocusedSupportingTextColor: Color? = null,
  @Field val disabledSupportingTextColor: Color? = null,
  @Field val errorSupportingTextColor: Color? = null,
  // Prefix
  @Field val focusedPrefixColor: Color? = null,
  @Field val unfocusedPrefixColor: Color? = null,
  @Field val disabledPrefixColor: Color? = null,
  @Field val errorPrefixColor: Color? = null,
  // Suffix
  @Field val focusedSuffixColor: Color? = null,
  @Field val unfocusedSuffixColor: Color? = null,
  @Field val disabledSuffixColor: Color? = null,
  @Field val errorSuffixColor: Color? = null,
) : Record

// endregion Records

// region Color builder

@Composable
fun TextFieldColorsRecord.toColors(isOutlined: Boolean): TextFieldColors {
  val defaults = if (isOutlined) OutlinedTextFieldDefaults.colors() else TextFieldDefaults.colors()
  // Outlined and Filled TextField both use TextFieldDefault.colors
  return TextFieldDefaults.colors(
    focusedTextColor = focusedTextColor.composeOrNull ?: defaults.focusedTextColor,
    unfocusedTextColor = unfocusedTextColor.composeOrNull ?: defaults.unfocusedTextColor,
    disabledTextColor = disabledTextColor.composeOrNull ?: defaults.disabledTextColor,
    errorTextColor = errorTextColor.composeOrNull ?: defaults.errorTextColor,
    focusedContainerColor = focusedContainerColor.composeOrNull ?: defaults.focusedContainerColor,
    unfocusedContainerColor = unfocusedContainerColor.composeOrNull ?: defaults.unfocusedContainerColor,
    disabledContainerColor = disabledContainerColor.composeOrNull ?: defaults.disabledContainerColor,
    errorContainerColor = errorContainerColor.composeOrNull ?: defaults.errorContainerColor,
    cursorColor = cursorColor.composeOrNull ?: defaults.cursorColor,
    errorCursorColor = errorCursorColor.composeOrNull ?: defaults.errorCursorColor,
    focusedIndicatorColor = focusedIndicatorColor.composeOrNull ?: defaults.focusedIndicatorColor,
    unfocusedIndicatorColor = unfocusedIndicatorColor.composeOrNull ?: defaults.unfocusedIndicatorColor,
    disabledIndicatorColor = disabledIndicatorColor.composeOrNull ?: defaults.disabledIndicatorColor,
    errorIndicatorColor = errorIndicatorColor.composeOrNull ?: defaults.errorIndicatorColor,
    focusedLeadingIconColor = focusedLeadingIconColor.composeOrNull ?: defaults.focusedLeadingIconColor,
    unfocusedLeadingIconColor = unfocusedLeadingIconColor.composeOrNull ?: defaults.unfocusedLeadingIconColor,
    disabledLeadingIconColor = disabledLeadingIconColor.composeOrNull ?: defaults.disabledLeadingIconColor,
    errorLeadingIconColor = errorLeadingIconColor.composeOrNull ?: defaults.errorLeadingIconColor,
    focusedTrailingIconColor = focusedTrailingIconColor.composeOrNull ?: defaults.focusedTrailingIconColor,
    unfocusedTrailingIconColor = unfocusedTrailingIconColor.composeOrNull ?: defaults.unfocusedTrailingIconColor,
    disabledTrailingIconColor = disabledTrailingIconColor.composeOrNull ?: defaults.disabledTrailingIconColor,
    errorTrailingIconColor = errorTrailingIconColor.composeOrNull ?: defaults.errorTrailingIconColor,
    focusedLabelColor = focusedLabelColor.composeOrNull ?: defaults.focusedLabelColor,
    unfocusedLabelColor = unfocusedLabelColor.composeOrNull ?: defaults.unfocusedLabelColor,
    disabledLabelColor = disabledLabelColor.composeOrNull ?: defaults.disabledLabelColor,
    errorLabelColor = errorLabelColor.composeOrNull ?: defaults.errorLabelColor,
    focusedPlaceholderColor = focusedPlaceholderColor.composeOrNull ?: defaults.focusedPlaceholderColor,
    unfocusedPlaceholderColor = unfocusedPlaceholderColor.composeOrNull ?: defaults.unfocusedPlaceholderColor,
    disabledPlaceholderColor = disabledPlaceholderColor.composeOrNull ?: defaults.disabledPlaceholderColor,
    errorPlaceholderColor = errorPlaceholderColor.composeOrNull ?: defaults.errorPlaceholderColor,
    focusedSupportingTextColor = focusedSupportingTextColor.composeOrNull ?: defaults.focusedSupportingTextColor,
    unfocusedSupportingTextColor = unfocusedSupportingTextColor.composeOrNull ?: defaults.unfocusedSupportingTextColor,
    disabledSupportingTextColor = disabledSupportingTextColor.composeOrNull ?: defaults.disabledSupportingTextColor,
    errorSupportingTextColor = errorSupportingTextColor.composeOrNull ?: defaults.errorSupportingTextColor,
    focusedPrefixColor = focusedPrefixColor.composeOrNull ?: defaults.focusedPrefixColor,
    unfocusedPrefixColor = unfocusedPrefixColor.composeOrNull ?: defaults.unfocusedPrefixColor,
    disabledPrefixColor = disabledPrefixColor.composeOrNull ?: defaults.disabledPrefixColor,
    errorPrefixColor = errorPrefixColor.composeOrNull ?: defaults.errorPrefixColor,
    focusedSuffixColor = focusedSuffixColor.composeOrNull ?: defaults.focusedSuffixColor,
    unfocusedSuffixColor = unfocusedSuffixColor.composeOrNull ?: defaults.unfocusedSuffixColor,
    disabledSuffixColor = disabledSuffixColor.composeOrNull ?: defaults.disabledSuffixColor,
    errorSuffixColor = errorSuffixColor.composeOrNull ?: defaults.errorSuffixColor,
  )
}

// endregion Color builder

// region Props

data class TextFieldProps(
  val defaultValue: MutableState<String> = mutableStateOf(""),
  val autoFocus: MutableState<Boolean> = mutableStateOf(false),
  val variant: MutableState<TextFieldVariant> = mutableStateOf(TextFieldVariant.FILLED),
  val enabled: MutableState<Boolean> = mutableStateOf(true),
  val readOnly: MutableState<Boolean> = mutableStateOf(false),
  val isError: MutableState<Boolean> = mutableStateOf(false),
  val singleLine: MutableState<Boolean> = mutableStateOf(false),
  val maxLines: MutableState<Int?> = mutableStateOf(null),
  val minLines: MutableState<Int?> = mutableStateOf(null),
  val keyboardOptions: MutableState<TextFieldKeyboardOptionsRecord?> = mutableStateOf(null),
  val shape: MutableState<ShapeRecord?> = mutableStateOf(null),
  val colors: MutableState<TextFieldColorsRecord?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList()),
) : ComposeProps

// endregion Props

// region Mappers

private fun String?.toKeyboardType(): KeyboardType = when (this) {
  "text" -> KeyboardType.Text
  "number" -> KeyboardType.Number
  "email" -> KeyboardType.Email
  "phone" -> KeyboardType.Phone
  "decimal" -> KeyboardType.Decimal
  "password" -> KeyboardType.Password
  "ascii" -> KeyboardType.Ascii
  "uri" -> KeyboardType.Uri
  "numberPassword" -> KeyboardType.NumberPassword
  else -> KeyboardType.Text
}

private fun String?.toCapitalization(): KeyboardCapitalization = when (this) {
  "characters" -> KeyboardCapitalization.Characters
  "none" -> KeyboardCapitalization.None
  "sentences" -> KeyboardCapitalization.Sentences
  "words" -> KeyboardCapitalization.Words
  else -> KeyboardCapitalization.None
}

private fun String?.toImeAction(): ImeAction = when (this) {
  "default" -> ImeAction.Default
  "none" -> ImeAction.None
  "go" -> ImeAction.Go
  "search" -> ImeAction.Search
  "send" -> ImeAction.Send
  "previous" -> ImeAction.Previous
  "next" -> ImeAction.Next
  "done" -> ImeAction.Done
  else -> ImeAction.Default
}

// endregion Mappers

// region View

@SuppressLint("ViewConstructor")
class TextFieldView(context: Context, appContext: AppContext) :
  ExpoComposeView<TextFieldProps>(context, appContext) {
  override val props = TextFieldProps()
  private val onValueChange by EventDispatcher()
  private val onFocusChanged by EventDispatcher()
  private val onKeyboardAction by EventDispatcher()

  private val textState = mutableStateOf<String?>(null)
  private val focusRequester by lazy { FocusRequester() }
  private var focusManager: FocusManager? = null

  var text: String?
    get() = textState.value
    set(value) {
      textState.value = value
    }

  fun focus() = focusRequester.requestFocus()
  fun blur() = focusManager?.clearFocus()

  @Composable
  override fun ComposableScope.Content() {
    focusManager = LocalFocusManager.current
    val value = textState.value ?: props.defaultValue.value
    val onValueChange: (String) -> Unit = {
      textState.value = it
      onValueChange(mapOf("value" to it))
    }

    // Slots
    val label: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "label")?.let { slot -> { slot.renderSlot() } }
    val placeholder: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "placeholder")?.let { slot -> { slot.renderSlot() } }
    val leadingIcon: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "leadingIcon")?.let { slot -> { slot.renderSlot() } }
    val trailingIcon: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "trailingIcon")?.let { slot -> { slot.renderSlot() } }
    val prefix: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "prefix")?.let { slot -> { slot.renderSlot() } }
    val suffix: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "suffix")?.let { slot -> { slot.renderSlot() } }
    val supportingText: (@Composable () -> Unit)? = findChildSlotView(this@TextFieldView, "supportingText")?.let { slot -> { slot.renderSlot() } }

    // Keyboard
    val kbOpts = props.keyboardOptions.value
    val keyboardOptions = KeyboardOptions.Default.copy(
      keyboardType = kbOpts?.keyboardType.toKeyboardType(),
      autoCorrectEnabled = kbOpts?.autoCorrectEnabled ?: true,
      capitalization = kbOpts?.capitalization.toCapitalization(),
      imeAction = kbOpts?.imeAction.toImeAction()
    )
    val currentText = { textState.value ?: "" }
    val keyboardActions = KeyboardActions(
      onDone = { defaultKeyboardAction(ImeAction.Done); onKeyboardAction(mapOf("action" to "done", "value" to currentText())) },
      onGo = { defaultKeyboardAction(ImeAction.Go); onKeyboardAction(mapOf("action" to "go", "value" to currentText())) },
      onNext = { defaultKeyboardAction(ImeAction.Next); onKeyboardAction(mapOf("action" to "next", "value" to currentText())) },
      onPrevious = { defaultKeyboardAction(ImeAction.Previous); onKeyboardAction(mapOf("action" to "previous", "value" to currentText())) },
      onSearch = { defaultKeyboardAction(ImeAction.Search); onKeyboardAction(mapOf("action" to "search", "value" to currentText())) },
      onSend = { defaultKeyboardAction(ImeAction.Send); onKeyboardAction(mapOf("action" to "send", "value" to currentText())) },
    )

    // Lines
    val singleLine = props.singleLine.value
    val maxLines = props.maxLines.value ?: if (singleLine) 1 else Int.MAX_VALUE
    val minLines = props.minLines.value ?: 1

    // Modifier
    val modifier = ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content, globalEventDispatcher)
      .focusRequester(focusRequester)
      .onFocusChanged { focusState ->
        onFocusChanged(mapOf("value" to focusState.isFocused))
      }

    if (props.autoFocus.value) {
      LaunchedEffect(Unit) { focusRequester.requestFocus() }
    }

    val isOutlined = props.variant.value == TextFieldVariant.OUTLINED
    val shape = shapeFromShapeRecord(props.shape.value)
      ?: if (isOutlined) OutlinedTextFieldDefaults.shape else TextFieldDefaults.shape
    val colors = props.colors.value?.toColors(isOutlined)
      ?: if (isOutlined) OutlinedTextFieldDefaults.colors() else TextFieldDefaults.colors()

    if (isOutlined) {
      OutlinedTextField(
        value = value, onValueChange = onValueChange, modifier = modifier,
        enabled = props.enabled.value, readOnly = props.readOnly.value,
        label = label, placeholder = placeholder,
        leadingIcon = leadingIcon, trailingIcon = trailingIcon,
        prefix = prefix, suffix = suffix, supportingText = supportingText,
        isError = props.isError.value,
        keyboardOptions = keyboardOptions, keyboardActions = keyboardActions,
        singleLine = singleLine, maxLines = maxLines, minLines = minLines,
        shape = shape, colors = colors,
      )
    } else {
      TextField(
        value = value, onValueChange = onValueChange, modifier = modifier,
        enabled = props.enabled.value, readOnly = props.readOnly.value,
        label = label, placeholder = placeholder,
        leadingIcon = leadingIcon, trailingIcon = trailingIcon,
        prefix = prefix, suffix = suffix, supportingText = supportingText,
        isError = props.isError.value,
        keyboardOptions = keyboardOptions, keyboardActions = keyboardActions,
        singleLine = singleLine, maxLines = maxLines, minLines = minLines,
        shape = shape, colors = colors,
      )
    }
  }
}

// endregion View
