package expo.modules.ui.button

import android.graphics.Color
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.ui.UIComposableScope
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.ShapeRecord
import expo.modules.ui.compose
import expo.modules.ui.shapeFromShapeRecord
import java.io.Serializable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
open class ButtonPressedEvent() : Record, Serializable

@OptimizedRecord
class ButtonColors : Record {
  @Field val containerColor: Color? = null
  @Field val contentColor: Color? = null
  @Field val disabledContainerColor: Color? = null
  @Field val disabledContentColor: Color? = null
}

@OptimizedRecord
class ContentPaddingRecord : Record {
  @Field val start: Double? = null
  @Field val top: Double? = null
  @Field val end: Double? = null
  @Field val bottom: Double? = null
}

fun ContentPaddingRecord.toPaddingValues(): PaddingValues =
  PaddingValues(
    start = start?.dp ?: ButtonDefaults.ContentPadding.calculateLeftPadding(androidx.compose.ui.unit.LayoutDirection.Ltr),
    top = top?.dp ?: ButtonDefaults.ContentPadding.calculateTopPadding(),
    end = end?.dp ?: ButtonDefaults.ContentPadding.calculateRightPadding(androidx.compose.ui.unit.LayoutDirection.Ltr),
    bottom = bottom?.dp ?: ButtonDefaults.ContentPadding.calculateBottomPadding()
  )

@OptimizedComposeProps
data class ButtonProps(
  val colors: ButtonColors = ButtonColors(),
  val enabled: Boolean = true,
  val contentPadding: ContentPaddingRecord? = null,
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
    contentPadding = props.contentPadding?.toPaddingValues() ?: ButtonDefaults.ContentPadding,
    colors = ButtonDefaults.buttonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.shape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
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
    contentPadding = props.contentPadding?.toPaddingValues() ?: ButtonDefaults.ContentPadding,
    colors = ButtonDefaults.filledTonalButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.filledTonalShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
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
    contentPadding = props.contentPadding?.toPaddingValues() ?: ButtonDefaults.ContentPadding,
    colors = ButtonDefaults.outlinedButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.outlinedShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
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
    contentPadding = props.contentPadding?.toPaddingValues() ?: ButtonDefaults.ContentPadding,
    colors = ButtonDefaults.elevatedButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.elevatedShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
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
    contentPadding = props.contentPadding?.toPaddingValues() ?: ButtonDefaults.TextButtonContentPadding,
    colors = ButtonDefaults.textButtonColors(
      containerColor = props.colors.containerColor.compose,
      contentColor = props.colors.contentColor.compose,
      disabledContainerColor = props.colors.disabledContainerColor.compose,
      disabledContentColor = props.colors.disabledContentColor.compose
    ),
    shape = shapeFromShapeRecord(props.shape) ?: ButtonDefaults.textShape,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(rowScope = this))
  }
}
