package expo.modules.ui

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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback
import expo.modules.kotlin.views.OptimizedComposeProps

// region Records

enum class TextFieldVariant(val value: String) : Enumerable {
  FILLED("filled"),
  OUTLINED("outlined"),
}

@OptimizedRecord
data class TextFieldKeyboardOptionsRecord(
  @Field val capitalization: String? = null,
  @Field val autoCorrectEnabled: Boolean? = null,
  @Field val keyboardType: String? = null,
  @Field val imeAction: String? = null,
) : Record

@OptimizedRecord
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

data class KeyboardActionEvent(
  @Field val action: String,
  @Field val value: String,
) : Record

data class TextFieldSelectionPayload(
  @Field val start: Int,
  @Field val end: Int,
) : Record

data class TextFieldValuePayload(
  @Field val text: String,
  @Field val selection: TextFieldSelectionPayload,
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

@OptimizedComposeProps
data class TextFieldProps(
  val value: ObservableState? = null,
  val autoFocus: Boolean = false,
  val variant: TextFieldVariant = TextFieldVariant.FILLED,
  val enabled: Boolean = true,
  val readOnly: Boolean = false,
  val isError: Boolean = false,
  val singleLine: Boolean = false,
  val maxLines: Int? = null,
  val minLines: Int? = null,
  val keyboardOptions: TextFieldKeyboardOptionsRecord? = null,
  val shape: ShapeRecord? = null,
  val colors: TextFieldColorsRecord? = null,
  val onValueChangeSync: WorkletCallback? = null,
  val modifiers: ModifierList = emptyList(),
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

// region Value helpers

private fun Any?.extractText(): String = when (this) {
  is String -> this
  is Map<*, *> -> (this["text"] as? String) ?: ""
  else -> ""
}

private fun getSelection(
  raw: Any?,
  isStringMode: Boolean,
  textLength: Int,
  localSelection: TextRange
): TextRange {
  if (isStringMode) {
    return TextRange(
      localSelection.start.coerceIn(0, textLength),
      localSelection.end.coerceIn(0, textLength)
    )
  }
  val selMap = (raw as? Map<*, *>)?.get("selection") as? Map<*, *>
  val start = (selMap?.get("start") as? Number)?.toInt()?.coerceIn(0, textLength) ?: textLength
  val end = (selMap?.get("end") as? Number)?.toInt()?.coerceIn(0, textLength) ?: textLength
  return TextRange(start, end)
}

// endregion Value helpers

// region View

@Composable
fun FunctionalComposableScope.TextFieldContent(
  props: TextFieldProps,
  setText: AsyncFunctionHandle<String>,
  focus: AsyncFunctionHandle<Unit>,
  blur: AsyncFunctionHandle<Unit>,
  onValueChanged: (TextFieldValuePayload) -> Unit,
  onFocusChange: (GenericEventPayload1<Boolean>) -> Unit,
  onKeyboardActionTriggered: (KeyboardActionEvent) -> Unit
) {
  val focusManager = LocalFocusManager.current
  val focusRequester = remember { FocusRequester() }
  val state = props.value ?: return

  val isStringMode = state.value is String
  setText.handle { text ->
    state.value = if (isStringMode) {
      text
    } else {
      mapOf(
        "text" to text,
        // on setting text, we set the selection to the end
        // TODO: add a setValue function to allow setting selection and text
        "selection" to mapOf("start" to text.length, "end" to text.length)
      )
    }
  }
  focus.handle {
    focusRequester.requestFocus()
  }
  blur.handle {
    focusManager.clearFocus()
  }

  // Slots
  val label: (@Composable () -> Unit)? = findChildSlotView(view, "label")?.let { slot -> { slot.renderSlot() } }
  val placeholder: (@Composable () -> Unit)? = findChildSlotView(view, "placeholder")?.let { slot -> { slot.renderSlot() } }
  val leadingIcon: (@Composable () -> Unit)? = findChildSlotView(view, "leadingIcon")?.let { slot -> { slot.renderSlot() } }
  val trailingIcon: (@Composable () -> Unit)? = findChildSlotView(view, "trailingIcon")?.let { slot -> { slot.renderSlot() } }
  val prefix: (@Composable () -> Unit)? = findChildSlotView(view, "prefix")?.let { slot -> { slot.renderSlot() } }
  val suffix: (@Composable () -> Unit)? = findChildSlotView(view, "suffix")?.let { slot -> { slot.renderSlot() } }
  val supportingText: (@Composable () -> Unit)? = findChildSlotView(view, "supportingText")?.let { slot -> { slot.renderSlot() } }

  // Keyboard
  val kbOpts = props.keyboardOptions
  val keyboardOptions = KeyboardOptions.Default.copy(
    keyboardType = kbOpts?.keyboardType.toKeyboardType(),
    autoCorrectEnabled = kbOpts?.autoCorrectEnabled ?: true,
    capitalization = kbOpts?.capitalization.toCapitalization(),
    imeAction = kbOpts?.imeAction.toImeAction()
  )
  val currentText = { state.value.extractText() }
  val keyboardActions = KeyboardActions(
    onDone = { defaultKeyboardAction(ImeAction.Done); onKeyboardActionTriggered(KeyboardActionEvent("done", currentText())) },
    onGo = { defaultKeyboardAction(ImeAction.Go); onKeyboardActionTriggered(KeyboardActionEvent("go", currentText())) },
    onNext = { defaultKeyboardAction(ImeAction.Next); onKeyboardActionTriggered(KeyboardActionEvent("next", currentText())) },
    onPrevious = { defaultKeyboardAction(ImeAction.Previous); onKeyboardActionTriggered(KeyboardActionEvent("previous", currentText())) },
    onSearch = { defaultKeyboardAction(ImeAction.Search); onKeyboardActionTriggered(KeyboardActionEvent("search", currentText())) },
    onSend = { defaultKeyboardAction(ImeAction.Send); onKeyboardActionTriggered(KeyboardActionEvent("send", currentText())) },
  )

  // Lines
  val singleLine = props.singleLine
  val maxLines = props.maxLines ?: if (singleLine) 1 else Int.MAX_VALUE
  val minLines = props.minLines ?: 1

  // Modifier
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
    .focusRequester(focusRequester)
    .onFocusChanged { focusState ->
      onFocusChange(GenericEventPayload1(focusState.isFocused))
    }

  if (props.autoFocus) {
    LaunchedEffect(Unit) { focusRequester.requestFocus() }
  }

  val isOutlined = props.variant == TextFieldVariant.OUTLINED
  val shape = shapeFromShapeRecord(props.shape)
    ?: if (isOutlined) OutlinedTextFieldDefaults.shape else TextFieldDefaults.shape
  val colors = props.colors?.toColors(isOutlined)
    ?: if (isOutlined) OutlinedTextFieldDefaults.colors() else TextFieldDefaults.colors()

  val localSelection = remember { mutableStateOf(TextRange.Zero) }
  val raw = state.value
  val text = raw.extractText()
  val selection = getSelection(raw, isStringMode, text.length, localSelection.value)
  val value = TextFieldValue(text, selection)
  val onValueChange: (TextFieldValue) -> Unit = { new ->
    if (new.text != value.text || new.selection != value.selection) {
      val payload = TextFieldValuePayload(
        text = new.text,
        selection = TextFieldSelectionPayload(new.selection.start, new.selection.end)
      )
      if (isStringMode) {
        state.value = new.text
        localSelection.value = new.selection
        onValueChanged(payload)
        props.onValueChangeSync?.invoke(new.text)
      } else {
        state.value = mapOf(
          "text" to new.text,
          "selection" to mapOf("start" to new.selection.start, "end" to new.selection.end)
        )
        onValueChanged(payload)
        props.onValueChangeSync?.invoke(payload)
      }
    }
  }

  if (isOutlined) {
    OutlinedTextField(
      value = value, onValueChange = onValueChange, modifier = modifier,
      enabled = props.enabled, readOnly = props.readOnly,
      label = label, placeholder = placeholder,
      leadingIcon = leadingIcon, trailingIcon = trailingIcon,
      prefix = prefix, suffix = suffix, supportingText = supportingText,
      isError = props.isError,
      keyboardOptions = keyboardOptions, keyboardActions = keyboardActions,
      singleLine = singleLine, maxLines = maxLines, minLines = minLines,
      shape = shape, colors = colors,
    )
  } else {
    TextField(
      value = value, onValueChange = onValueChange, modifier = modifier,
      enabled = props.enabled, readOnly = props.readOnly,
      label = label, placeholder = placeholder,
      leadingIcon = leadingIcon, trailingIcon = trailingIcon,
      prefix = prefix, suffix = suffix, supportingText = supportingText,
      isError = props.isError,
      keyboardOptions = keyboardOptions, keyboardActions = keyboardActions,
      singleLine = singleLine, maxLines = maxLines, minLines = minLines,
      shape = shape, colors = colors,
    )
  }
}

// endregion View
