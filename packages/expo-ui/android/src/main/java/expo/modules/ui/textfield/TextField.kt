package expo.modules.ui.textfield

import android.graphics.Color
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.MotionScheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldColors
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.AsyncFunctionHandle2
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.GenericEventPayload1
import expo.modules.ui.ModifierList
import expo.modules.ui.ShapeRecord
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView
import expo.modules.ui.renderSlot
import expo.modules.ui.shapeFromShapeRecord
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback

// region Records

enum class TextFieldVariant(val value: String) : Enumerable {
  FILLED("filled"),
  OUTLINED("outlined")
}

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

// region View

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun FunctionalComposableScope.TextFieldContent(
  props: TextFieldProps,
  setText: AsyncFunctionHandle<String>,
  setSelection: AsyncFunctionHandle2<Int, Int>,
  clear: AsyncFunctionHandle<Unit>,
  focus: AsyncFunctionHandle<Unit>,
  blur: AsyncFunctionHandle<Unit>,
  onValueChanged: (TextFieldValuePayload) -> Unit,
  onFocusChange: (GenericEventPayload1<Boolean>) -> Unit,
  onKeyboardActionTriggered: (KeyboardActionEvent) -> Unit,
  onSelectionChanged: (TextFieldSelectionPayload) -> Unit
) {
  val core = rememberTextFieldCore(
    value = props.value,
    selection = props.selection,
    maxLength = props.maxLength,
    autoFocus = props.autoFocus,
    keyboardOptionsRecord = props.keyboardOptions,
    modifiers = props.modifiers,
    onValueChangeSync = props.onValueChangeSync,
    setText = setText,
    setSelection = setSelection,
    clear = clear,
    focus = focus,
    blur = blur,
    onValueChanged = onValueChanged,
    onFocusChange = onFocusChange,
    onKeyboardActionTriggered = onKeyboardActionTriggered,
    onSelectionChanged = onSelectionChanged
  )

  // Slots
  val label: (@Composable () -> Unit)? = findChildSlotView(view, "label")?.let { slot -> { slot.renderSlot() } }
  val placeholder: (@Composable () -> Unit)? = findChildSlotView(view, "placeholder")?.let { slot -> { slot.renderSlot() } }
  val leadingIcon: (@Composable () -> Unit)? = findChildSlotView(view, "leadingIcon")?.let { slot -> { slot.renderSlot() } }
  val trailingIcon: (@Composable () -> Unit)? = findChildSlotView(view, "trailingIcon")?.let { slot -> { slot.renderSlot() } }
  val prefix: (@Composable () -> Unit)? = findChildSlotView(view, "prefix")?.let { slot -> { slot.renderSlot() } }
  val suffix: (@Composable () -> Unit)? = findChildSlotView(view, "suffix")?.let { slot -> { slot.renderSlot() } }
  val supportingText: (@Composable () -> Unit)? = findChildSlotView(view, "supportingText")?.let { slot -> { slot.renderSlot() } }

  // Lines
  val singleLine = props.singleLine
  val maxLines = props.maxLines ?: if (singleLine) 1 else Int.MAX_VALUE
  val minLines = props.minLines ?: 1

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

  val textStyle = props.textStyle.toTextStyle(appContext.reactContext)
  val visualTransformation = props.visualTransformation.toVisualTransformation()

  // Workaround (pending upstream fix, https://issuetracker.google.com/issues/519816993)
  // the expressive motion scheme's spring overshoots >1f, and TextField's calculateHeight
  // extrapolates that overshoot, transiently growing the field and jiggling surrounding
  // content. Forcing the standard (non-overshooting) spatial spring removes the jiggle.
  MaterialExpressiveTheme(motionScheme = MotionScheme.standard()) {
    if (isOutlined) {
      OutlinedTextField(
        value = core.value, onValueChange = core.onValueChange, modifier = core.modifier,
        enabled = props.enabled, readOnly = props.readOnly, textStyle = textStyle,
        label = label, placeholder = placeholder,
        leadingIcon = leadingIcon, trailingIcon = trailingIcon,
        prefix = prefix, suffix = suffix, supportingText = supportingText,
        isError = props.isError, visualTransformation = visualTransformation,
        keyboardOptions = core.keyboardOptions, keyboardActions = core.keyboardActions,
        singleLine = singleLine, maxLines = maxLines, minLines = minLines,
        shape = shape, colors = colors
      )
    } else {
      TextField(
        value = core.value, onValueChange = core.onValueChange, modifier = core.modifier,
        enabled = props.enabled, readOnly = props.readOnly, textStyle = textStyle,
        label = label, placeholder = placeholder,
        leadingIcon = leadingIcon, trailingIcon = trailingIcon,
        prefix = prefix, suffix = suffix, supportingText = supportingText,
        isError = props.isError, visualTransformation = visualTransformation,
        keyboardOptions = core.keyboardOptions, keyboardActions = core.keyboardActions,
        singleLine = singleLine, maxLines = maxLines, minLines = minLines,
        shape = shape, colors = colors
      )
    }
  }
}

// endregion View
