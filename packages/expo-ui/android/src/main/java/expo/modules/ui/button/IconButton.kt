package expo.modules.ui.button

import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.UIComposableScope
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose
import expo.modules.ui.shapeFromShapeRecord

@Composable
fun FunctionalComposableScope.IconButtonContent(
  props: ButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  val shape = shapeFromShapeRecord(props.shape)
  IconButton(
    onClick = { onButtonPressed(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = IconButtonDefaults.iconButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shape ?: IconButtonDefaults.standardShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope())
  }
}

@Composable
fun FunctionalComposableScope.FilledIconButtonContent(
  props: ButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  val shape = shapeFromShapeRecord(props.shape)
  FilledIconButton(
    onClick = { onButtonPressed(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = IconButtonDefaults.filledIconButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shape ?: IconButtonDefaults.filledShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope())
  }
}

@Composable
fun FunctionalComposableScope.FilledTonalIconButtonContent(
  props: ButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  val shape = shapeFromShapeRecord(props.shape)
  FilledTonalIconButton(
    onClick = { onButtonPressed(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = IconButtonDefaults.filledTonalIconButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shape ?: IconButtonDefaults.filledShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope())
  }
}

@Composable
fun FunctionalComposableScope.OutlinedIconButtonContent(
  props: ButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  val shape = shapeFromShapeRecord(props.shape)
  OutlinedIconButton(
    onClick = { onButtonPressed(ButtonPressedEvent()) },
    enabled = props.enabled,
    colors = IconButtonDefaults.outlinedIconButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shape ?: IconButtonDefaults.outlinedShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope())
  }
}
