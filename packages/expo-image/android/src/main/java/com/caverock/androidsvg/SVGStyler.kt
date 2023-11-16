package com.caverock.androidsvg

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

internal fun applyTintColor(element: SVG.SvgObject, newColor: Int) {
  if (element is SVG.SvgElementBase) {
    replaceStyles(element.baseStyle, newColor)
    replaceStyles(element.style, newColor)
  }

  if (element is SVG.SvgContainer) {
    for (child in element.children) {
      applyTintColor(child, newColor)
    }
  }
}

fun applyTintColor(svg: SVG, newColor: Int) {
  val root = svg.rootElement

  replaceStyles(root.style, newColor)

  for (child in root.children) {
    applyTintColor(child, newColor)
  }
}
