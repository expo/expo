@file:Suppress("FunctionName")

package expo.modules.kotlin.views.decorators

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.BoxShadow
import com.facebook.react.uimanager.style.LogicalEdge
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.views.ViewDefinitionBuilder
import expo.modules.rncompatibility.parseBoxShadow

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseBorderColorProps(crossinline body: (view: T, edge: LogicalEdge, color: Int?) -> Unit) {
  PropGroup(
    ViewProps.BORDER_COLOR to Spacing.ALL,
    ViewProps.BORDER_LEFT_COLOR to Spacing.LEFT,
    ViewProps.BORDER_RIGHT_COLOR to Spacing.RIGHT,
    ViewProps.BORDER_TOP_COLOR to Spacing.TOP,
    ViewProps.BORDER_BOTTOM_COLOR to Spacing.BOTTOM,
    ViewProps.BORDER_START_COLOR to Spacing.START,
    ViewProps.BORDER_END_COLOR to Spacing.END,
    ViewProps.BORDER_BLOCK_COLOR to Spacing.BLOCK,
    ViewProps.BORDER_BLOCK_END_COLOR to Spacing.BLOCK_END,
    ViewProps.BORDER_BLOCK_START_COLOR to Spacing.BLOCK_START
  ) { view: T, spacing: Int, color: Int? ->
    body(view, LogicalEdge.fromSpacingType(spacing), color)
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseBorderColorProps() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseBorderColorProps { view: View, edge: LogicalEdge, color: Int? ->
    BackgroundStyleApplicator.setBorderColor(
      view,
      edge,
      color
    )
  }
}

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseBorderWidthProps(crossinline body: (view: T, edge: LogicalEdge, width: Float?) -> Unit) {
  PropGroup(
    ViewProps.BORDER_WIDTH,
    ViewProps.BORDER_LEFT_WIDTH,
    ViewProps.BORDER_RIGHT_WIDTH,
    ViewProps.BORDER_TOP_WIDTH,
    ViewProps.BORDER_BOTTOM_WIDTH,
    ViewProps.BORDER_START_WIDTH,
    ViewProps.BORDER_END_WIDTH
  ) { view: T, index: Int, width: Float? ->
    body(view, LogicalEdge.entries[index], width)
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseBorderWidthProps() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseBorderWidthProps { view, edge, width ->
    BackgroundStyleApplicator.setBorderWidth(
      view,
      edge,
      width ?: Float.NaN
    )
  }
}

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseBorderRadiusProps(crossinline body: (view: T, border: BorderRadiusProp, radius: LengthPercentage?) -> Unit) {
  PropGroup(
    ViewProps.BORDER_RADIUS,
    ViewProps.BORDER_TOP_LEFT_RADIUS,
    ViewProps.BORDER_TOP_RIGHT_RADIUS,
    ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
    ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
    ViewProps.BORDER_TOP_START_RADIUS,
    ViewProps.BORDER_TOP_END_RADIUS,
    ViewProps.BORDER_BOTTOM_START_RADIUS,
    ViewProps.BORDER_BOTTOM_END_RADIUS,
    ViewProps.BORDER_END_END_RADIUS,
    ViewProps.BORDER_END_START_RADIUS,
    ViewProps.BORDER_START_END_RADIUS,
    ViewProps.BORDER_START_START_RADIUS
  ) { view: T, index: Int, radius: Float? ->
    body(
      view,
      BorderRadiusProp.entries[index],
      radius?.let { LengthPercentage(it, LengthPercentageType.POINT) }
    )
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseBorderRadiusProps() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseBorderRadiusProps { view, border, radius ->
    BackgroundStyleApplicator.setBorderRadius(
      view,
      border,
      radius
    )
  }
}

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseBorderStyleProp(crossinline body: (view: T, style: BorderStyle?) -> Unit) {
  Prop("borderStyle") { view: T, style: String? ->
    val parsedBorderStyle = style?.let { BorderStyle.fromString(style) }
    body(view, parsedBorderStyle)
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseBorderStyleProp() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseBorderStyleProp { view, style ->
    BackgroundStyleApplicator.setBorderStyle(
      view,
      style
    )
  }
}

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseBackgroundProp(crossinline body: (view: T, color: Int?) -> Unit) {
  Prop(ViewProps.BACKGROUND_COLOR) { view: T, color: Int? ->
    body(view, color)
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseBackgroundProp() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseBackgroundProp { view, color ->
    BackgroundStyleApplicator.setBackgroundColor(view, color)
  }
}

inline fun <reified T : View> ViewDefinitionBuilder<T>.UseBoxShadowProp(crossinline body: (view: T, shadow: List<BoxShadow>) -> Unit) {
  Prop(ViewProps.BOX_SHADOW) { view: T, shadows: ReadableArray? ->
    if (shadows == null) {
      body(view, emptyList())
      return@Prop
    }

    val shadowStyle = mutableListOf<BoxShadow>()
    for (i in 0..<shadows.size()) {
      val shadow = parseBoxShadow(shadows.getMap(i), view.context) ?: continue
      shadowStyle.add((shadow))
    }
    body(view, shadowStyle)
  }
}

private fun <T : View> ViewDefinitionBuilder<T>.UseBoxShadowProp() {
  enforceType<ViewDefinitionBuilder<View>>(this)
  UseBoxShadowProp { view, shadows ->
    BackgroundStyleApplicator.setBoxShadow(view, shadows)
  }
}

/**
 * Decorates the view definition builder with CSS props.
 * This includes border, background, and box shadow properties.
 */
@PublishedApi
internal fun <T : View> ViewDefinitionBuilder<T>.UseCSSProps() {
  UseBorderColorProps()
  UseBorderWidthProps()
  UseBorderRadiusProps()
  UseBorderStyleProp()

  UseBackgroundProp()

  UseBoxShadowProp()
}
