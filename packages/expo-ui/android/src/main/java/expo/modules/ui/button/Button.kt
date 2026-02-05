package expo.modules.ui.button

import android.graphics.Color
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.ShapeRecord
import expo.modules.ui.compose
import expo.modules.ui.getImageVector
import expo.modules.ui.menu.LocalContextMenuExpanded
import expo.modules.ui.shapeFromShapeRecord
import java.io.Serializable

open class ButtonPressedEvent() : Record, Serializable

enum class ButtonVariant(val value: String) : Enumerable {
  DEFAULT("default"),
  BORDERED("bordered"),
  BORDERLESS("borderless"),
  OUTLINED("outlined"),
  ELEVATED("elevated")
}

class ButtonColors : Record {
  @Field
  val containerColor: Color? = null

  @Field
  val contentColor: Color? = null

  @Field
  val disabledContainerColor: Color? = null

  @Field
  val disabledContentColor: Color? = null
}

data class ButtonProps(
  val text: String = "",
  val variant: ButtonVariant? = ButtonVariant.DEFAULT,
  val elementColors: ButtonColors = ButtonColors(),
  val leadingIcon: String? = null,
  val trailingIcon: String? = null,
  val disabled: Boolean? = false,
  val shape: ShapeRecord? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun StyledButton(
  variant: ButtonVariant,
  colors: ButtonColors,
  disabled: Boolean,
  onPress: () -> Unit,
  modifier: Modifier = Modifier,
  shape: Shape?,
  content: @Composable (RowScope.() -> Unit)
) {
  when (variant) {
    ButtonVariant.BORDERED -> FilledTonalButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.filledTonalButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      shape = shape ?: ButtonDefaults.filledTonalShape,
      modifier = modifier
    )

    ButtonVariant.BORDERLESS -> TextButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.textButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      shape = shape ?: ButtonDefaults.textShape,
      modifier = modifier
    )

    ButtonVariant.OUTLINED -> OutlinedButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.outlinedButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      shape = shape ?: ButtonDefaults.outlinedShape,
      modifier = modifier
    )

    ButtonVariant.ELEVATED -> ElevatedButton(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.elevatedButtonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      shape = shape ?: ButtonDefaults.elevatedShape,
      modifier = modifier
    )

    else -> androidx.compose.material3.Button(
      onPress,
      enabled = !disabled,
      content = content,
      colors = ButtonDefaults.buttonColors(
        containerColor = colors.containerColor.compose,
        contentColor = colors.contentColor.compose,
        disabledContainerColor = colors.disabledContainerColor.compose,
        disabledContentColor = colors.disabledContentColor.compose
      ),
      shape = shape ?: ButtonDefaults.shape,
      modifier = modifier
    )
  }
}

@Composable
fun FunctionalComposableScope.ButtonContent(
  props: ButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  val variant = props.variant
  val text = props.text
  val colors = props.elementColors
  val leadingIcon = props.leadingIcon
  val trailingIcon = props.trailingIcon
  val disabled = props.disabled

  // Check if this Button is inside a ContextMenu
  val contextMenuExpanded = LocalContextMenuExpanded.current

  StyledButton(
    variant ?: ButtonVariant.DEFAULT,
    colors,
    disabled ?: false,
    onPress = {
      // If inside ContextMenu, expand the menu
      contextMenuExpanded?.let { it.value = true }
      // Also fire the button pressed event
      onButtonPressed(ButtonPressedEvent())
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope),
    shape = shapeFromShapeRecord(props.shape)
  ) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      Children(ComposableScope(rowScope = this))
      leadingIcon?.let { iconName ->
        getImageVector(iconName)?.let {
          Icon(
            it,
            contentDescription = iconName,
            modifier = Modifier.padding(end = 8.dp)
          )
        }
      }

      Text(text)

      trailingIcon?.let { iconName ->
        getImageVector(iconName)?.let {
          Icon(
            it,
            contentDescription = iconName,
            modifier = Modifier.padding(start = 8.dp)
          )
        }
      }
    }
  }
}
