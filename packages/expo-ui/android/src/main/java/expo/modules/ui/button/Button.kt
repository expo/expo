package expo.modules.ui.button

import android.graphics.Color
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.ShapeRecord
import expo.modules.ui.compose
import expo.modules.ui.shapeFromShapeRecord
import java.io.Serializable

open class ButtonPressedEvent() : Record, Serializable

class ButtonColors : Record {
  @Field val containerColor: Color? = null
  @Field val contentColor: Color? = null
  @Field val disabledContainerColor: Color? = null
  @Field val disabledContentColor: Color? = null
}

data class ButtonProps(
  val colors: ButtonColors = ButtonColors(),
  val enabled: Boolean = true,
  val shape: ShapeRecord? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ButtonContent(
  props: ButtonProps,
  onClick: (ButtonPressedEvent) -> Unit
) {
  androidx.compose.material3.Button(
    onClick = { onClick(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = ButtonDefaults.buttonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.shape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope(rowScope = this))
  }
}

@Composable
fun FunctionalComposableScope.FilledTonalButtonContent(
  props: ButtonProps,
  onClick: (ButtonPressedEvent) -> Unit
) {
  FilledTonalButton(
    onClick = { onClick(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = ButtonDefaults.filledTonalButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.filledTonalShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope(rowScope = this))
  }
}

@Composable
fun FunctionalComposableScope.OutlinedButtonContent(
  props: ButtonProps,
  onClick: (ButtonPressedEvent) -> Unit
) {
  OutlinedButton(
    onClick = { onClick(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = ButtonDefaults.outlinedButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.outlinedShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope(rowScope = this))
  }
}

@Composable
fun FunctionalComposableScope.ElevatedButtonContent(
  props: ButtonProps,
  onClick: (ButtonPressedEvent) -> Unit
) {
  ElevatedButton(
    onClick = { onClick(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = ButtonDefaults.elevatedButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.elevatedShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope(rowScope = this))
  }
}

@Composable
fun FunctionalComposableScope.TextButtonContent(
  props: ButtonProps,
  onClick: (ButtonPressedEvent) -> Unit
) {
  TextButton(
    onClick = { onClick(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = ButtonDefaults.textButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.textShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope(rowScope = this))
  }
}
