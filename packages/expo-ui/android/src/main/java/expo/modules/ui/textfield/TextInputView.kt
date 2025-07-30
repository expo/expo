package expo.modules.ui.textfield

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.KeyboardCapitalization
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.Direction
import java.util.EnumSet

data class TextInputProps(
    val defaultValue: MutableState<String> = mutableStateOf(""),
    val placeholder: MutableState<String> = mutableStateOf(""),
    val multiline: MutableState<Boolean> = mutableStateOf(false),
    val numberOfLines: MutableState<Int?> = mutableStateOf(null),
    val keyboardType: MutableState<String> = mutableStateOf("default"),
    val autocorrection: MutableState<Boolean> = mutableStateOf(true),
    val autoCapitalize: MutableState<String> = mutableStateOf("none"),
    val testID: MutableState<String>?,
    val style: TextStyleProps?,
    val secureEntry: MutableState<Boolean> = mutableStateOf(false),
    val mask: MutableState<String>?,
    val onValueChanged: (() -> Unit)? = null
    val onTextFieldFocus: (() -> Unit)? = null
    val onTextFieldBlur: (() -> Unit)? = null

) : ComposeProps

data class TextStyleProps(
    val color: MutableState<String>?,
    val size: MutableState<Int>?,
    val lineHeight: MutableState<Int>?,
    val letterSpacing: MutableState<Int>?,
    val height: MutableState<Int>?,
    val fontFamily: MutableState<String>?,
    val fontWeight: MutableState<String>?
): ComposeProps


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

@Composable
internal fun Float.pxToSp(): TextUnit {
    return (this / LocalDensity.current.fontScale).sp
}

class TextInputView(context: Context, appContext: AppContext) :
    ExpoComposeView<TextInputProps>(context, appContext, withHostingView = true) {
    override val props = TextInputProps()
    private val onValueChanged by EventDispatcher()

    @Composable
    override fun Content(modifier: Modifier) {
        var value by remember { props.defaultValue }
        AutoSizingComposable(shadowNodeProxy, axis = EnumSet.of(Direction.VERTICAL)) {
            TextField(
                modifier = modifier.testTag(props.testID).onFocusChanged {if(it.isFocused) props.onTextFieldFocus else props.onTextFieldBlur}
                        value = value,
                onValueChange = {
                    value = it
                    props.onValueChange()
                    onValueChanged(mapOf("value" to it))
                },
                visualTransformation = if (props.securityEntry) PasswordVisualTransformation() else MaskedVisualTransformation(
                    props.mask
                ),
                placeholder = {
                    Text(
                        text = props.placeholder.value,
                        style = props.style
                    )
                },
                maxLines = if (props.multiline.value) props.numberOfLines.value
                    ?: Int.MAX_VALUE else 1,
                singleLine = !props.multiline.value,
                textStyle = props.style,
                keyboardOptions = KeyboardOptions.Default.copy(
                    keyboardType = props.keyboardType.value.keyboardType(),
                    autoCorrectEnabled = props.autocorrection.value,
                    capitalization = props.autoCapitalize.value.autoCapitalize()
                )
            )
        }
    }
}
