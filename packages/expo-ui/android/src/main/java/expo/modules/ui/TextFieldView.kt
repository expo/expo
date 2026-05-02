package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.TextSelectionColors
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
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
  OUTLINED("outlined")
}

@OptimizedRecord
data class TextFieldKeyboardOptionsRecord(
  @Field val capitalization: String? = null,
  @Field val autoCorrectEnabled: Boolean? = null,
  @Field val keyboardType: String? = null,
  @Field val imeAction: String? = null
) : Record

@OptimizedRecord
data class TextFieldTextStyleRecord(
  @Field val textAlign: TextAlignType? = null,
  @Field val color: Color? = null,
  @Field val fontSize: Float? = null,
  @Field val fontFamily: String? = null,
  @Field val fontWeight: TextFontWeight? = null,
  @Field val lineHeight: Float? = null,
  @Field val letterSpacing: Float? = null
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
  @Field val errorSuffixColor: Color? = null
) : Record

@OptimizedRecord
data class TextFieldSelectionColorsRecord(
  @Field val handleColor: Color? = null,
  @Field val backgroundColor: Color? = null
) : Record

data class KeyboardActionEvent(
  @Field val action: String,
  @Field val value: String
) : Record

data class TextFieldSelectionPayload(
  @Field val start: Int,
  @Field val end: Int
) : Record

data class TextFieldValuePayload(
  @Field val text: String,
  @Field val selection: TextFieldSelectionPayload
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
    errorSuffixColor = errorSuffixColor.composeOrNull ?: defaults.errorSuffixColor
  )
}

// endregion Color builder

// region Props

@OptimizedComposeProps
data class TextFieldProps(
  val value: ObservableState = ObservableState(""),
  val selection: ObservableState = ObservableState(mapOf("start" to 0, "end" to 0)),
  val maxLength: Int? = null,
  val autoFocus: Boolean = false,
  val variant: TextFieldVariant = TextFieldVariant.FILLED,
  val enabled: Boolean = true,
  val readOnly: Boolean = false,
  val isError: Boolean = false,
  val singleLine: Boolean = false,
  val maxLines: Int? = null,
  val minLines: Int? = null,
  val textStyle: TextFieldTextStyleRecord? = null,
  val visualTransformation: String? = null,
  val keyboardOptions: TextFieldKeyboardOptionsRecord? = null,
  val shape: ShapeRecord? = null,
  val colors: TextFieldColorsRecord? = null,
  val textSelectionColors: TextFieldSelectionColorsRecord? = null,
  val onValueChangeSync: WorkletCallback? = null,
  val modifiers: ModifierList = emptyList()
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
  setSelection: AsyncFunctionHandle<TextFieldSelectionPayload>,
  clear: AsyncFunctionHandle<Unit>,
  focus: AsyncFunctionHandle<Unit>,
  blur: AsyncFunctionHandle<Unit>,
  onValueChanged: (TextFieldValuePayload) -> Unit,
  onFocusChange: (GenericEventPayload1<Boolean>) -> Unit,
  onKeyboardActionTriggered: (KeyboardActionEvent) -> Unit,
  onSelectionChanged: (TextFieldSelectionPayload) -> Unit
) {
  val focusManager = LocalFocusManager.current
  val focusRequester = remember { FocusRequester() }
  val state = props.value

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
  setSelection.handle { req ->
    val text = state.value.extractText()
    val clampedStart = req.start.coerceIn(0, text.length)
    val clampedEnd = req.end.coerceIn(0, text.length)
    props.selection.value = mapOf("start" to clampedStart, "end" to clampedEnd)
  }
  clear.handle {
    state.value = if (isStringMode) {
      ""
    } else {
      mapOf("text" to "", "selection" to mapOf("start" to 0, "end" to 0))
    }
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
    onDone = {
      defaultKeyboardAction(ImeAction.Done)
      onKeyboardActionTriggered(KeyboardActionEvent("done", currentText()))
    },
    onGo = {
      defaultKeyboardAction(ImeAction.Go)
      onKeyboardActionTriggered(KeyboardActionEvent("go", currentText()))
    },
    onNext = {
      defaultKeyboardAction(ImeAction.Next)
      onKeyboardActionTriggered(KeyboardActionEvent("next", currentText()))
    },
    onPrevious = {
      defaultKeyboardAction(ImeAction.Previous)
      onKeyboardActionTriggered(KeyboardActionEvent("previous", currentText()))
    },
    onSearch = {
      defaultKeyboardAction(ImeAction.Search)
      onKeyboardActionTriggered(KeyboardActionEvent("search", currentText()))
    },
    onSend = {
      defaultKeyboardAction(ImeAction.Send)
      onKeyboardActionTriggered(KeyboardActionEvent("send", currentText()))
    }
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
  val baseColors = props.colors?.toColors(isOutlined)
    ?: if (isOutlined) OutlinedTextFieldDefaults.colors() else TextFieldDefaults.colors()
  val colors = props.textSelectionColors?.let { record ->
    val handle = record.handleColor.composeOrNull
    val background = record.backgroundColor.composeOrNull
    if (handle == null && background == null) {
      baseColors
    } else {
      baseColors.copy(
        textSelectionColors = TextSelectionColors(
          handleColor = handle ?: baseColors.textSelectionColors.handleColor,
          backgroundColor = background ?: handle?.copy(alpha = 0.4f)
            ?: baseColors.textSelectionColors.backgroundColor
        )
      )
    }
  } ?: baseColors

  val localSelection = remember { mutableStateOf(TextRange.Zero) }
  val raw = state.value
  val text = raw.extractText()
  val selection = getSelection(raw, isStringMode, text.length, localSelection.value)

  val localValue = remember { mutableStateOf(TextFieldValue(text, selection)) }
  if (localValue.value.text != text || localValue.value.selection != selection) {
    localValue.value = TextFieldValue(text, selection)
  }

  props.selection.value?.let { rawSel ->
    val selMap = rawSel as? Map<*, *>
    val externalStart = (selMap?.get("start") as? Number)?.toInt()
    val externalEnd = (selMap?.get("end") as? Number)?.toInt()
    if (externalStart != null && externalEnd != null) {
      val cur = localValue.value
      val clampedStart = externalStart.coerceIn(0, cur.text.length)
      val clampedEnd = externalEnd.coerceIn(0, cur.text.length)
      if (cur.selection.start != clampedStart || cur.selection.end != clampedEnd) {
        localValue.value = cur.copy(selection = TextRange(clampedStart, clampedEnd))
      }
    }
  }

  val value = localValue.value

  val onValueChange: (TextFieldValue) -> Unit = { incoming ->
    val new = props.maxLength?.let { max ->
      if (incoming.text.length > max) {
        val truncated = incoming.text.substring(0, max)
        incoming.copy(
          text = truncated,
          selection = TextRange(
            incoming.selection.start.coerceAtMost(max),
            incoming.selection.end.coerceAtMost(max)
          )
        )
      } else {
        null
      }
    } ?: incoming
    val prev = localValue.value
    localValue.value = new
    if (new.text != prev.text || new.selection != prev.selection) {
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
    if (new.selection != prev.selection) {
      val cur = props.selection.value as? Map<*, *>
      val curStart = (cur?.get("start") as? Number)?.toInt()
      val curEnd = (cur?.get("end") as? Number)?.toInt()
      if (curStart != new.selection.start || curEnd != new.selection.end) {
        props.selection.value = mapOf(
          "start" to new.selection.start,
          "end" to new.selection.end
        )
      }
      onSelectionChanged(TextFieldSelectionPayload(new.selection.start, new.selection.end))
    }
  }

  val context = appContext.reactContext
  val textStyle = props.textStyle?.let { textStyleProps ->
    TextStyle(
      color = colorToComposeColorOrNull(textStyleProps.color) ?: androidx.compose.ui.graphics.Color.Unspecified,
      fontSize = textStyleProps.fontSize?.sp ?: TextUnit.Unspecified,
      fontWeight = textStyleProps.fontWeight?.toComposeFontWeight(),
      fontFamily = context?.let { resolveFontFamily(textStyleProps.fontFamily, it) },
      letterSpacing = textStyleProps.letterSpacing?.sp ?: TextUnit.Unspecified,
      lineHeight = textStyleProps.lineHeight?.sp ?: TextUnit.Unspecified,
      textAlign = textStyleProps.textAlign?.toComposeTextAlign() ?: TextAlign.Unspecified
    )
  } ?: TextStyle.Default

  val visualTransformation = when (props.visualTransformation) {
    "password" -> PasswordVisualTransformation()
    else -> VisualTransformation.None
  }

  if (isOutlined) {
    OutlinedTextField(
      value = value, onValueChange = onValueChange, modifier = modifier,
      enabled = props.enabled, readOnly = props.readOnly, textStyle = textStyle,
      label = label, placeholder = placeholder,
      leadingIcon = leadingIcon, trailingIcon = trailingIcon,
      prefix = prefix, suffix = suffix, supportingText = supportingText,
      isError = props.isError, visualTransformation = visualTransformation,
      keyboardOptions = keyboardOptions, keyboardActions = keyboardActions,
      singleLine = singleLine, maxLines = maxLines, minLines = minLines,
      shape = shape, colors = colors
    )
  } else {
    TextField(
      value = value, onValueChange = onValueChange, modifier = modifier,
      enabled = props.enabled, readOnly = props.readOnly, textStyle = textStyle,
      label = label, placeholder = placeholder,
      leadingIcon = leadingIcon, trailingIcon = trailingIcon,
      prefix = prefix, suffix = suffix, supportingText = supportingText,
      isError = props.isError, visualTransformation = visualTransformation,
      keyboardOptions = keyboardOptions, keyboardActions = keyboardActions,
      singleLine = singleLine, maxLines = maxLines, minLines = minLines,
      shape = shape, colors = colors
    )
  }
}

// endregion View
