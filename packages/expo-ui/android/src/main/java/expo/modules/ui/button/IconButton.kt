package expo.modules.ui.button

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.ShapeRecord
import expo.modules.ui.compose
import expo.modules.ui.shapeFromShapeRecord

enum class IconButtonVariant(val value: String) : Enumerable {
  DEFAULT("default"),
  BORDERED("bordered"),
  OUTLINED("outlined")
}

data class IconButtonProps(
  val variant: IconButtonVariant? = IconButtonVariant.DEFAULT,
  val elementColors: ButtonColors = ButtonColors(),
  val disabled: Boolean? = false,
  val shape: ShapeRecord? = null,
  val modifiers: ModifierList = emptyList()
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

@Composable
fun FunctionalComposableScope.IconButtonContent(
  props: IconButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  val variant = props.variant
  val colors = props.elementColors
  val disabled = props.disabled

  StyledIconButton(
    variant ?: IconButtonVariant.DEFAULT,
    colors,
    disabled ?: false,
    onPress = { onButtonPressed(ButtonPressedEvent()) },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope),
    shape = shapeFromShapeRecord(props.shape)
  ) {
    Box(modifier = Modifier.fillMaxSize()) {
      Children(ComposableScope())
    }
  }
}
