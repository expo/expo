package com.caverock.androidsvg

import android.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SVGStylerTest {
  private fun tint(document: String, tintColor: Int): List<SVG.SvgElementBase> {
    val svg = SVG.getFromString(document)
    applyTintColor(svg, tintColor)

    return flatten(svg.rootElement)
  }

  private fun flatten(element: SVG.SvgObject): List<SVG.SvgElementBase> {
    val children = (element as? SVG.SvgContainer)?.children.orEmpty().flatMap { flatten(it) }

    return listOfNotNull(element as? SVG.SvgElementBase) + children
  }

  private fun colourOf(paint: SVG.SvgPaint?) = (paint as? SVG.Colour)?.colour

  @Test
  fun `tints a shape with an explicit fill`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="black"/></svg>"""
    val rect = tint(document, Color.RED).filterIsInstance<SVG.Rect>().single()
    assertEquals(Color.RED, colourOf(rect.baseStyle.fill))
  }

  @Test
  fun `tints a shape without any fill`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>"""
    val rect = tint(document, Color.RED).filterIsInstance<SVG.Rect>().single()
    assertEquals(Color.RED, colourOf(rect.style.fill))
  }

  @Test
  fun `tints a shape filled with currentColor`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="currentColor"/></svg>"""
    val rect = tint(document, Color.RED).filterIsInstance<SVG.Rect>().single()
    assertEquals(Color.RED, colourOf(rect.baseStyle.fill))
  }

  @Test
  fun `tints a shape stroked with currentColor`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="10" y2="5" stroke="currentColor"/></svg>"""
    val line = tint(document, Color.RED).filterIsInstance<SVG.Line>().single()
    assertEquals(Color.RED, colourOf(line.baseStyle.stroke))
  }

  @Test
  fun `tints a gradient stop using currentColor`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop offset="0" stop-color="currentColor"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>"""
    val stop = tint(document, Color.RED).filterIsInstance<SVG.Stop>().single()
    assertEquals(Color.RED, colourOf(stop.baseStyle.stopColor))
  }

  @Test
  fun `tints currentColor in a group that sets color`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><g color="blue"><rect width="10" height="10" fill="currentColor"/></g></svg>"""
    val elements = tint(document, Color.RED)
    assertEquals(Color.RED, elements.filterIsInstance<SVG.Group>().single().baseStyle.color.colour)
    assertEquals(Color.RED, colourOf(elements.filterIsInstance<SVG.Rect>().single().baseStyle.fill))
  }

  @Test
  fun `keeps currentColor in a mask untinted`() {
    val document = """<svg xmlns="http://www.w3.org/2000/svg"><defs><mask id="m"><rect width="5" height="10" fill="currentColor"/></mask></defs><rect width="10" height="10" mask="url(#m)"/></svg>"""
    val maskRect = tint(document, Color.RED).filterIsInstance<SVG.Mask>().single().children.single() as SVG.Rect
    assertTrue(maskRect.baseStyle.fill is SVG.CurrentColor)
  }
}
