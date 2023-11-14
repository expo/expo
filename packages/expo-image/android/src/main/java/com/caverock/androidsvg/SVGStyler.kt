package com.caverock.androidsvg

internal fun replaceColour(paint: SVG.SvgPaint?, newColour: Int) {
  if (paint is SVG.Colour && paint !== SVG.Colour.TRANSPARENT) {
    paint.colour = newColour
  }
}

internal fun replaceStyles(style: SVG.Style?, newColour: Int) {
  if (style == null) {
    return
  }

  replaceColour(style.color, newColour)
  replaceColour(style.fill, newColour)
  replaceColour(style.stroke, newColour)
  replaceColour(style.stopColor, newColour)
  replaceColour(style.solidColor, newColour)
  replaceColour(style.viewportFill, newColour)
}

internal fun applyTintColor(element: SVG.SvgObject, newColour: Int) {
  if (element is SVG.SvgElementBase) {
    replaceStyles(element.baseStyle, newColour)
    replaceStyles(element.style, newColour)
  }

  if (element is SVG.SvgContainer) {
    for (child in element.children) {
      applyTintColor(child, newColour)
    }
  }
}

fun applyTintColor(svg: SVG, newColour: Int) {
  val root = svg.rootElement

  replaceStyles(root.style, newColour)

  for (child in root.children) {
    applyTintColor(child, newColour)
  }
}
