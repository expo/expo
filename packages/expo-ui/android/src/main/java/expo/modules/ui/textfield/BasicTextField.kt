package expo.modules.ui.textfield

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.isUnspecified
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.AsyncFunctionHandle2
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.GenericEventPayload1
import expo.modules.ui.ModifierList
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView
import expo.modules.ui.renderSlot
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback

// region Inner text field plumbing

/**
 * Carries the framework-provided `innerTextField` lambda from `BasicTextField`'s
 * `decorationBox` down to the [InnerTextFieldView] marker, wherever the JS
 * decoration places it. `null` when read outside a decoration (the marker then
 * renders nothing rather than crashing).
 */
val LocalInnerTextField = compositionLocalOf<(@Composable () -> Unit)?> { null }

@OptimizedComposeProps
class InnerTextFieldProps : ComposeProps

/**
 * Slot view for `BasicTextField.InnerTextField`.
 */
@SuppressLint("ViewConstructor")
class InnerTextFieldView(context: Context, appContext: AppContext) :
  ExpoComposeView<InnerTextFieldProps>(context, appContext) {
  override val props = InnerTextFieldProps()

  @Composable
  override fun ComposableScope.Content() {
    LocalInnerTextField.current?.invoke()
  }
}

// endregion Inner text field plumbing

// region Placeholder plumbing

/**
 * Tracks whether textfield is empty, in order to render placeholder slot
 */
val LocalTextFieldIsEmpty = compositionLocalOf { true }

@OptimizedComposeProps
class PlaceholderProps : ComposeProps

/**
 * Slot view for `BasicTextField.Placeholder`. Renders its children only while
 * the field is empty.
 */
@SuppressLint("ViewConstructor")
class PlaceholderView(context: Context, appContext: AppContext) :
  ExpoComposeView<PlaceholderProps>(context, appContext) {
  override val props = PlaceholderProps()

  @Composable
  override fun ComposableScope.Content() {
    if (LocalTextFieldIsEmpty.current) {
      Children(this)
    }
  }
}

// endregion Placeholder plumbing

// region Props

@OptimizedComposeProps
data class BasicTextFieldProps(
  val value: ObservableState = ObservableState(""),
  val selection: ObservableState = ObservableState(mapOf("start" to 0, "end" to 0)),
  val maxLength: Int? = null,
  val autoFocus: Boolean = false,
  val enabled: Boolean = true,
  val readOnly: Boolean = false,
  val singleLine: Boolean = false,
  val maxLines: Int? = null,
  val minLines: Int? = null,
  val textStyle: TextFieldTextStyleRecord? = null,
  val visualTransformation: String? = null,
  val keyboardOptions: TextFieldKeyboardOptionsRecord? = null,
  val cursorColor: Color? = null,
  val textSelectionColors: TextFieldSelectionColorsRecord? = null,
  val onValueChangeSync: WorkletCallback? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

// endregion Props

// region View

@Composable
fun FunctionalComposableScope.BasicTextFieldContent(
  props: BasicTextFieldProps,
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

  val singleLine = props.singleLine
  val maxLines = props.maxLines ?: if (singleLine) 1 else Int.MAX_VALUE
  val minLines = props.minLines ?: 1

  val textStyle = props.textStyle.toTextStyle(appContext.reactContext).let {
    if (it.color.isUnspecified) it.copy(color = MaterialTheme.colorScheme.onSurface) else it
  }
  val visualTransformation = props.visualTransformation.toVisualTransformation()
  val cursorBrush = SolidColor(props.cursorColor.composeOrNull ?: MaterialTheme.colorScheme.primary)

  val current = LocalTextSelectionColors.current
  val selectionColors = props.textSelectionColors?.let { record ->
    val handle = record.handleColor.composeOrNull
    val background = record.backgroundColor.composeOrNull
    if (handle == null && background == null) {
      current
    } else {
      TextSelectionColors(
        handleColor = handle ?: current.handleColor,
        backgroundColor = background ?: handle?.copy(alpha = 0.4f) ?: current.backgroundColor
      )
    }
  } ?: current

  val decoration: (@Composable () -> Unit)? =
    findChildSlotView(view, "decorationBox")?.let { slot -> { slot.renderSlot() } }

  CompositionLocalProvider(LocalTextSelectionColors provides selectionColors) {
    BasicTextField(
      value = core.value,
      onValueChange = core.onValueChange,
      modifier = core.modifier,
      enabled = props.enabled,
      readOnly = props.readOnly,
      textStyle = textStyle,
      keyboardOptions = core.keyboardOptions,
      keyboardActions = core.keyboardActions,
      singleLine = singleLine,
      maxLines = maxLines,
      minLines = minLines,
      visualTransformation = visualTransformation,
      cursorBrush = cursorBrush,
      decorationBox = { innerTextField ->
        if (decoration != null) {
          CompositionLocalProvider(
            LocalInnerTextField provides innerTextField,
            LocalTextFieldIsEmpty provides core.value.text.isEmpty()
          ) {
            decoration()
          }
        } else {
          innerTextField()
        }
      }
    )
  }
}

// endregion View
