package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope


data class SurfaceBorder(
  @Field val width: Float = 1f,
  @Field val color: Color? = null
) : Record

data class SurfaceProps(
  val color: Color? = null,
  val contentColor: Color? = null,
  val tonalElevation: Float? = null,
  val shadowElevation: Float? = null,
  val shape: ShapeRecord? = null,
  val border: SurfaceBorder? = null,
  val clickable: Boolean = false,
  val enabled: Boolean = true,
  val selected: Boolean? = null,
  val checked: Boolean? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SurfaceContent(
  props: SurfaceProps,
  onClick: () -> Unit,
  onCheckedChange: (Boolean) -> Unit
) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val color = props.color?.compose ?: MaterialTheme.colorScheme.surface
  val contentColor = props.contentColor?.compose ?: contentColorFor(color)
  val shape = remember(props.shape) { shapeFromShapeRecord(props.shape) ?: RectangleShape }
  val tonalElevation = (props.tonalElevation ?: 0f).dp
  val shadowElevation = (props.shadowElevation ?: 0f).dp
  val outlineColor = MaterialTheme.colorScheme.outline
  val border = remember(props.border, outlineColor) {
    props.border?.let { b ->
      val bColor = b.color.composeOrNull ?: outlineColor
      androidx.compose.foundation.BorderStroke(b.width.dp, bColor)
    }
  }

  val content: @Composable () -> Unit = { Children(ComposableScope()) }

  when {
    // Toggleable variant
    props.checked != null -> Surface(
      checked = props.checked,
      onCheckedChange = { onCheckedChange(it) },
      modifier = modifier,
      enabled = props.enabled,
      shape = shape,
      color = color,
      contentColor = contentColor,
      tonalElevation = tonalElevation,
      shadowElevation = shadowElevation,
      border = border,
      content = content
    )
    // Selectable variant
    props.selected != null -> Surface(
      selected = props.selected,
      onClick = { onClick() },
      modifier = modifier,
      enabled = props.enabled,
      shape = shape,
      color = color,
      contentColor = contentColor,
      tonalElevation = tonalElevation,
      shadowElevation = shadowElevation,
      border = border,
      content = content
    )
    // Clickable variant
    props.clickable -> Surface(
      onClick = { onClick() },
      modifier = modifier,
      enabled = props.enabled,
      shape = shape,
      color = color,
      contentColor = contentColor,
      tonalElevation = tonalElevation,
      shadowElevation = shadowElevation,
      border = border,
      content = content
    )
    // Basic (non-interactive) variant
    else -> Surface(
      modifier = modifier,
      shape = shape,
      color = color,
      contentColor = contentColor,
      tonalElevation = tonalElevation,
      shadowElevation = shadowElevation,
      border = border,
      content = content
    )
  }
}
