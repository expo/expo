package com.caverock.androidsvg

import com.caverock.androidsvg.SVG.SPECIFIED_COLOR
import com.caverock.androidsvg.SVG.SPECIFIED_FILL
import com.caverock.androidsvg.SVG.SvgElementBase

internal fun replaceColor(paint: SVG.SvgPaint?, newColor: Int) {
  if (paint is SVG.Colour && paint !== SVG.Colour.TRANSPARENT) {
    paint.colour = newColor
  }
}

internal fun replaceStyles(style: SVG.Style?, newColor: Int) {
  if (style == null) {
    return
  }

  replaceColor(style.color, newColor)
  replaceColor(style.fill, newColor)
  replaceColor(style.stroke, newColor)
  replaceColor(style.stopColor, newColor)
  replaceColor(style.solidColor, newColor)
  replaceColor(style.viewportFill, newColor)
}

internal fun hasStyle(element: SvgElementBase): Boolean {
  if (element.style == null && element.baseStyle == null) {
    return false
  }

  val style = element.style
  val hasColorInStyle = style != null &&
    (
      style.color != null || style.fill != null || style.stroke != null ||
        style.stroke != null || style.stopColor != null || style.solidColor != null
      )

  if (hasColorInStyle) {
    return true
  }

  val baseStyle = element.baseStyle ?: return false
  return baseStyle.color != null || baseStyle.fill != null || baseStyle.stroke != null ||
    baseStyle.viewportFill != null || baseStyle.stopColor != null || baseStyle.solidColor != null
}

internal fun defineStyles(element: SvgElementBase, newColor: Int, hasStyle: Boolean) {
  if (hasStyle) {
    return
  }

  val style = if (element.style != null) {
    element.style
  } else {
    SVG.Style().also {
      element.style = it
    }
  }

  val color = SVG.Colour(newColor)
  when (element) {
    is SVG.Path,
    is SVG.Circle,
    is SVG.Ellipse,
    is SVG.Rect,
    is SVG.SolidColor,
    is SVG.Line,
    is SVG.Polygon,
    is SVG.PolyLine -> {
      style.apply {
        fill = color

        specifiedFlags = SPECIFIED_FILL
      }
    }

    is SVG.TextPath -> {
      style.apply {
        this.color = color

        specifiedFlags = SPECIFIED_COLOR
      }
    }
  }
}

internal fun applyTintColor(element: SVG.SvgObject, newColor: Int, parentDefinesStyle: Boolean) {
  // We want to keep the colors in the mask as they control the visibility of the element to which the mask is applied.
  if (element is SVG.Mask) {
    return
  }

  val definesStyle = if (element is SvgElementBase) {
    val hasStyle = parentDefinesStyle || hasStyle(element)

    replaceStyles(element.baseStyle, newColor)
    replaceStyles(element.style, newColor)
    defineStyles(element, newColor, hasStyle)

    hasStyle
  } else {
    parentDefinesStyle
  }

  if (element is SVG.SvgContainer) {
    for (child in element.children) {
      applyTintColor(child, newColor, definesStyle)
    }
  }
}

fun applyTintColor(svg: SVG, newColor: Int) {
  val root = svg.rootElement

  svg.cssRules?.forEach { rule ->
    replaceStyles(rule.style, newColor)
  }
  replaceStyles(root.baseStyle, newColor)
  replaceStyles(root.style, newColor)
  val hasStyle = hasStyle(root)

  for (child in root.children) {
    applyTintColor(child, newColor, hasStyle)
  }
}
