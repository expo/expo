package expo.modules.ui.button

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize

import androidx.compose.material3.ButtonDefaults

import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.OutlinedIconButton
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.ui.DynamicTheme
import expo.modules.ui.ExpoModifier
import expo.modules.ui.ShapeRecord
import expo.modules.ui.compose
import expo.modules.ui.fromExpoModifiers
import expo.modules.ui.shapeFromShapeRecord

enum class IconButtonVariant(val value: String) : Enumerable {
    DEFAULT("default"),
    BORDERED("bordered"),
    OUTLINED("outlined"),
}



data class IconButtonProps(
    val variant: MutableState<IconButtonVariant?> = mutableStateOf(IconButtonVariant.DEFAULT),
    val elementColors: MutableState<ButtonColors> = mutableStateOf(ButtonColors()),
    val disabled: MutableState<Boolean?> = mutableStateOf(false),
    val modifiers: MutableState<List<ExpoModifier>?> = mutableStateOf(emptyList()),
    val shape: MutableState<ShapeRecord?> = mutableStateOf(null)
) : ComposeProps

@Composable
fun StyledIconButton(
    variant: IconButtonVariant,
    colors: ButtonColors,
    disabled: Boolean,
    onPress: () -> Unit,
    modifier: Modifier = Modifier,
    shape: Shape?,
    content: @Composable (() -> Unit)
) {
    when (variant) {
      IconButtonVariant.BORDERED -> FilledTonalIconButton(
            onPress,
            enabled = !disabled,
            content = content,
            colors = IconButtonDefaults.filledTonalIconButtonColors(
                containerColor = colors.containerColor.compose,
                contentColor = colors.contentColor.compose,
                disabledContainerColor = colors.disabledContainerColor.compose,
                disabledContentColor = colors.disabledContentColor.compose
            ),
            shape = shape ?: ButtonDefaults.filledTonalShape,
            modifier = modifier
        )


      IconButtonVariant.OUTLINED -> OutlinedIconButton(
            onPress,
            enabled = !disabled,
            content = content,
            colors = IconButtonDefaults.outlinedIconButtonColors(
                containerColor = colors.containerColor.compose,
                contentColor = colors.contentColor.compose,
                disabledContainerColor = colors.disabledContainerColor.compose,
                disabledContentColor = colors.disabledContentColor.compose
            ),
            shape = shape ?: ButtonDefaults.outlinedShape,
            modifier = modifier
        )


        else -> IconButton(
            onPress,
            enabled = !disabled,
            content = content,
            colors = IconButtonDefaults.iconButtonColors(
                containerColor = colors.containerColor.compose,
                contentColor = colors.contentColor.compose,
                disabledContainerColor = colors.disabledContainerColor.compose,
                disabledContentColor = colors.disabledContentColor.compose
            ),
            modifier = modifier
        )
    }
}

class IconButton(context: Context, appContext: AppContext) :
    ExpoComposeView<IconButtonProps>(context, appContext) {
    override val props = IconButtonProps()
    private val onButtonPressed by EventDispatcher<ButtonPressedEvent>()

    init {
        clipToPadding = false // needed for elevated buttons to work
        clipChildren = false
    }

    @Composable
    override fun ComposableScope.Content() {
        val (variant) = props.variant
        val (colors) = props.elementColors
        val (disabled) = props.disabled

        DynamicTheme {
            StyledIconButton(
                variant ?: IconButtonVariant.DEFAULT,
                colors,
                disabled ?: false,
                onPress = { onButtonPressed.invoke(ButtonPressedEvent()) },
                modifier = Modifier.fromExpoModifiers(
                    props.modifiers.value,
                    composableScope = this@Content
                ),
                shape = shapeFromShapeRecord(props.shape.value)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    Children(this@Content)
                }
            }
        }
    }
}

