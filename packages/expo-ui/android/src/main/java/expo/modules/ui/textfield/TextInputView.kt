package expo.modules.ui.textfield

import MaskedVisualTransformation
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
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
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.sp
import com.example.poctextfield.R
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
    val testID: MutableState<String>? = null,
    val style: TextStyleProps? = null,
    val secureEntry: MutableState<Boolean> = mutableStateOf(false),
    val mask: MutableState<String>? = null

) : ComposeProps

data class TextStyleProps(
    val color: MutableState<String>?,
    val size: MutableState<Int>?,
    val lineHeight: MutableState<Int>?,
    val letterSpacing: MutableState<Int>?,
    val height: MutableState<Int>?,
    val fontFamily: MutableState<String>?,
    val fontWeight: MutableState<String>?
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

fun getFontWeight(fontWeight: String): FontWeight {
    return when (fontWeight) {
        "100" -> FontWeight.Thin
        "200" -> FontWeight.W200
        "300" -> FontWeight.W300
        "400" -> FontWeight.W400
        "500" -> FontWeight.W500
        "600" -> FontWeight.W600
        "700" -> FontWeight.W700
        "800" -> FontWeight.W800
        "900" -> FontWeight.W900
        else -> FontWeight.Normal
    }
}

fun convertColor(hexString: String): Color? {
    var hex = hexString.trim().uppercase()

    if (hex.startsWith("#")) {
        hex = hex.substring(1)
    }

    val hexNumber: Long?
    var red = 0.0
    var green = 0.0
    var blue = 0.0
    var alpha = 1.0 // Default value

    when (hex.length) {
        6 -> {
            hexNumber = hex.toLongOrNull(16)
            if (hexNumber != null) {
                red = ((hexNumber shr 16) and 0xFF) / 255.0
                green = ((hexNumber shr 8) and 0xFF) / 255.0
                blue = (hexNumber and 0xFF) / 255.0
            }
        }

        8 -> {
            hexNumber = hex.toLongOrNull(16)
            if (hexNumber != null) {
                red = ((hexNumber shr 24) and 0xFF) / 255.0
                green = ((hexNumber shr 16) and 0xFF) / 255.0
                blue = ((hexNumber shr 8) and 0xFF) / 255.0
                alpha = (hexNumber and 0xFF) / 255.0
            }
        }

        else -> return null
    }

    return Color(red.toFloat(), green.toFloat(), blue.toFloat(), alpha.toFloat())
}

fun convertToFontFamily(font: String): FontFamily {
    return when (font) {
        "Roobert" -> FontFamily(
            Font(R.font.Roobert)
        )

        else -> FontFamily.Default
    }
}

@Composable
private fun formatTextStyles(props: TextStyleProps?): TextStyle {
    return TextStyle(
        fontSize = props?.size?.value?.pxToSp() ?: 14.sp,
        fontWeight = props?.fontWeight?.value?.let { getFontWeight(it) },
        lineHeight = props?.lineHeight?.value?.pxToSp() ?: 14.sp,
        color = props?.color?.value?.let { convertColor(it) } ?: Color.Unspecified,
        fontFamily = props?.fontFamily?.value?.let { convertToFontFamily(it) },
        letterSpacing = props?.letterSpacing?.value?.pxToSp() ?: 14.sp,
        )
}


@Composable
private fun Int.pxToSp(): TextUnit {
    return (this / LocalDensity.current.fontScale).sp
}

class TextInputView(context: Context, appContext: AppContext) :
    ExpoComposeView<TextInputProps>(context, appContext, withHostingView = true) {
    override val props = TextInputProps()
    private val onValueChanged by EventDispatcher()
    private val onTextFieldFocus by EventDispatcher()
    private val onTextFieldBlur by EventDispatcher()


    @Composable
    override fun Content(modifier: Modifier) {
        var value by remember { props.defaultValue }
        val style = formatTextStyles(props.style)
        AutoSizingComposable(shadowNodeProxy, axis = EnumSet.of(Direction.VERTICAL)) {
            TextField(
                modifier = modifier
                    .testTag(props.testID?.value ?: String())
                    .onFocusChanged { if (it.isFocused) onTextFieldFocus() else onTextFieldBlur() },
                value = value,
                onValueChange = {
                    value = it
                    onValueChanged(mapOf("value" to it))
                },

                visualTransformation = if (props.secureEntry.value) PasswordVisualTransformation() else props.mask?.let { mask ->
                    MaskedVisualTransformation(
                        mask.value
                    )
                } ?: VisualTransformation.None,
                placeholder = {
                    Text(
                        text = props.placeholder.value,
                        style = style
                    )
                },
                maxLines = if (props.multiline.value) props.numberOfLines.value
                    ?: Int.MAX_VALUE else 1,
                singleLine = !props.multiline.value,
                textStyle = style,
                keyboardOptions = KeyboardOptions.Default.copy(
                    keyboardType = props.keyboardType.value.keyboardType(),
                    autoCorrectEnabled = props.autocorrection.value,
                    capitalization = props.autoCapitalize.value.autoCapitalize()
                )
            )
        }
    }
}
