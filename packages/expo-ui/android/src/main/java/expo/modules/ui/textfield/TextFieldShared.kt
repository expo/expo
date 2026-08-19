package expo.modules.ui.textfield

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
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
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.AsyncFunctionHandle2
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.GenericEventPayload1
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.TextAlignType
import expo.modules.ui.TextFontWeight
import expo.modules.ui.colorToComposeColorOrNull
import expo.modules.ui.resolveFontFamily
import expo.modules.ui.state.ObservableState
import expo.modules.ui.state.WorkletCallback

// region Records

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

internal fun String?.toVisualTransformation(): VisualTransformation = when (this) {
  "password" -> PasswordVisualTransformation()
  else -> VisualTransformation.None
}

internal fun TextFieldTextStyleRecord?.toTextStyle(context: Context?): TextStyle {
  if (this == null) return TextStyle.Default
  return TextStyle(
    color = colorToComposeColorOrNull(color) ?: androidx.compose.ui.graphics.Color.Unspecified,
    fontSize = fontSize?.sp ?: TextUnit.Unspecified,
    fontWeight = fontWeight?.toComposeFontWeight(),
    fontFamily = context?.let { resolveFontFamily(fontFamily, it) },
    letterSpacing = letterSpacing?.sp ?: TextUnit.Unspecified,
    lineHeight = lineHeight?.sp ?: TextUnit.Unspecified,
    textAlign = textAlign?.toComposeTextAlign() ?: TextAlign.Unspecified
  )
}

// endregion Mappers

// region Value helpers

private fun ObservableState.extractSelection(textLength: Int): TextRange {
  val selMap = value as? Map<*, *>
  val start = (selMap?.get("start") as? Number)?.toInt()?.coerceIn(0, textLength) ?: 0
  val end = (selMap?.get("end") as? Number)?.toInt()?.coerceIn(0, textLength) ?: 0
  return TextRange(start, end)
}

// endregion Value helpers

// region Shared core

class TextFieldCore(
  val value: TextFieldValue,
  val onValueChange: (TextFieldValue) -> Unit,
  val keyboardOptions: KeyboardOptions,
  val keyboardActions: KeyboardActions,
  val modifier: Modifier
)

@Composable
fun FunctionalComposableScope.rememberTextFieldCore(
  value: ObservableState,
  selection: ObservableState,
  maxLength: Int?,
  autoFocus: Boolean,
  keyboardOptionsRecord: TextFieldKeyboardOptionsRecord?,
  modifiers: ModifierList,
  onValueChangeSync: WorkletCallback?,
  setText: AsyncFunctionHandle<String>,
  setSelection: AsyncFunctionHandle2<Int, Int>,
  clear: AsyncFunctionHandle<Unit>,
  focus: AsyncFunctionHandle<Unit>,
  blur: AsyncFunctionHandle<Unit>,
  onValueChanged: (TextFieldValuePayload) -> Unit,
  onFocusChange: (GenericEventPayload1<Boolean>) -> Unit,
  onKeyboardActionTriggered: (KeyboardActionEvent) -> Unit,
  onSelectionChanged: (TextFieldSelectionPayload) -> Unit
): TextFieldCore {
  val focusManager = LocalFocusManager.current
  val focusRequester = remember { FocusRequester() }
  val state = value

  setText.handle { text ->
    state.value = text
    // setText moves the cursor to the end; use setSelection afterwards to override.
    selection.value = mapOf("start" to text.length, "end" to text.length)
  }
  focus.handle {
    focusRequester.requestFocus()
  }
  blur.handle {
    focusManager.clearFocus()
  }
  setSelection.handle { start, end ->
    val text = state.value as? String ?: ""
    val clampedStart = start.coerceIn(0, text.length)
    val clampedEnd = end.coerceIn(0, text.length)
    selection.value = mapOf("start" to clampedStart, "end" to clampedEnd)
  }
  clear.handle {
    state.value = ""
    selection.value = mapOf("start" to 0, "end" to 0)
  }

  // Keyboard
  val keyboardOptions = KeyboardOptions.Default.copy(
    keyboardType = keyboardOptionsRecord?.keyboardType.toKeyboardType(),
    autoCorrectEnabled = keyboardOptionsRecord?.autoCorrectEnabled ?: true,
    capitalization = keyboardOptionsRecord?.capitalization.toCapitalization(),
    imeAction = keyboardOptionsRecord?.imeAction.toImeAction()
  )
  val currentText = { state.value as? String ?: "" }
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

  // Modifier
  val modifier = ModifierRegistry.applyModifiers(modifiers, appContext, composableScope, globalEventDispatcher)
    .focusRequester(focusRequester)
    .onFocusChanged { focusState ->
      onFocusChange(GenericEventPayload1(focusState.isFocused))
    }

  if (autoFocus) {
    LaunchedEffect(Unit) { focusRequester.requestFocus() }
  }

  val text = state.value as? String ?: ""
  val sel = selection.extractSelection(text.length)

  val localValue = remember { mutableStateOf(TextFieldValue(text, sel)) }
  if (localValue.value.text != text || localValue.value.selection != sel) {
    localValue.value = TextFieldValue(text, sel)
  }

  val onValueChange: (TextFieldValue) -> Unit = { incoming ->
    val new = maxLength?.let { max ->
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
    if (new.selection != prev.selection) {
      val cur = selection.value as? Map<*, *>
      val curStart = (cur?.get("start") as? Number)?.toInt()
      val curEnd = (cur?.get("end") as? Number)?.toInt()
      if (curStart != new.selection.start || curEnd != new.selection.end) {
        selection.value = mapOf(
          "start" to new.selection.start,
          "end" to new.selection.end
        )
      }
      onSelectionChanged(TextFieldSelectionPayload(new.selection.start, new.selection.end))
    }
    if (new.text != prev.text) {
      state.value = new.text
      val payload = TextFieldValuePayload(
        text = new.text,
        selection = TextFieldSelectionPayload(new.selection.start, new.selection.end)
      )
      onValueChanged(payload)
      onValueChangeSync?.invoke(new.text)
    }
  }

  return TextFieldCore(localValue.value, onValueChange, keyboardOptions, keyboardActions, modifier)
}

// endregion Shared core
