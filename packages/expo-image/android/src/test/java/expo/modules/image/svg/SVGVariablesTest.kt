package expo.modules.image.svg

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * These expectations are shared with `ios/Tests/SVGVariablesTests.swift`. The two implementations
 * are separate ports of the same rules, so a case added here belongs there too.
 */
class SVGVariablesTest {
  private fun substitute(source: String, variables: Map<String, String>) =
    SVGVariables.substitute(source, variables)

  // region attribute values

  @Test
  fun `substitutes a supplied value`() {
    assertEquals(
      """<svg><rect fill="red"/></svg>""",
      substitute("""<svg><rect fill="var(--a, #000)"/></svg>""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `uses the fallback when the variable is not supplied`() {
    assertEquals(
      """<svg><rect fill="#000"/></svg>""",
      substitute("""<svg><rect fill="var(--a, #000)"/></svg>""", mapOf("--b" to "red"))
    )
  }

  @Test
  fun `leaves a document without variables untouched`() {
    assertEquals(
      """<svg><rect fill="#123456"/></svg>""",
      substitute("""<svg><rect fill="#123456"/></svg>""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `substitutes values that are not colors`() {
    assertEquals(
      """<rect stroke-width="4"/>""",
      substitute("""<rect stroke-width="var(--w, 1)"/>""", mapOf("--w" to "4"))
    )
    assertEquals(
      """<rect opacity="0.25"/>""",
      substitute("""<rect opacity="var(--o, 1)"/>""", mapOf("--o" to "0.25"))
    )
  }

  @Test
  fun `substitutes non-color values inside functions, lists and percentages`() {
    assertEquals(
      """<g transform="rotate(45 50 50)"/>""",
      substitute("""<g transform="rotate(var(--angle, 0) 50 50)"/>""", mapOf("--angle" to "45"))
    )
    assertEquals(
      """<rect stroke-dasharray="8 4 1 4"/>""",
      substitute("""<rect stroke-dasharray="var(--dash, 4 2)"/>""", mapOf("--dash" to "8 4 1 4"))
    )
    assertEquals(
      """<rect rx="12" width="75%"/>""",
      substitute(
        """<rect rx="var(--radius, 0)" width="var(--w, 50%)"/>""",
        mapOf("--radius" to "12", "--w" to "75%")
      )
    )
  }

  @Test
  fun `substitutes several references in one value`() {
    assertEquals(
      """<rect stroke-dasharray="5 6"/>""",
      substitute(
        """<rect stroke-dasharray="var(--a, 1) var(--b, 2)"/>""",
        mapOf("--a" to "5", "--b" to "6")
      )
    )
    assertEquals(
      """<rect stroke-dasharray="5 2"/>""",
      substitute("""<rect stroke-dasharray="var(--a, 1) var(--b, 2)"/>""", mapOf("--a" to "5"))
    )
  }

  @Test
  fun `preserves the quote style and surrounding whitespace`() {
    assertEquals(
      """<rect fill='red'/>""",
      substitute("""<rect fill='var(--a, #000)'/>""", mapOf("--a" to "red"))
    )
    assertEquals(
      """<rect   fill = "red"   stroke="b"  />""",
      substitute("""<rect   fill = "var(--a, #000)"   stroke="b"  />""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `does not treat a greater-than inside a value as the end of the tag`() {
    assertEquals(
      """<rect data-x="a>b" fill="red"/>""",
      substitute("""<rect data-x="a>b" fill="var(--a,#000)"/>""", mapOf("--a" to "red"))
    )
  }

  // endregion
  // region fallbacks

  @Test
  fun `allows commas inside a fallback`() {
    assertEquals(
      """<rect fill="rgb(0, 0, 0)"/>""",
      substitute("""<rect fill="var(--a, rgb(0, 0, 0))"/>""", mapOf("--z" to "x"))
    )
  }

  @Test
  fun `resolves a nested variable in the fallback`() {
    assertEquals(
      """<rect fill="blue"/>""",
      substitute("""<rect fill="var(--a, var(--b, green))"/>""", mapOf("--b" to "blue"))
    )
  }

  @Test
  fun `falls through nested fallbacks to the literal`() {
    assertEquals(
      """<rect fill="green"/>""",
      substitute("""<rect fill="var(--a, var(--b, green))"/>""", mapOf("--c" to "blue"))
    )
  }

  @Test
  fun `prefers the outer value over a nested fallback`() {
    assertEquals(
      """<rect fill="red"/>""",
      substitute(
        """<rect fill="var(--a, var(--b, green))"/>""",
        mapOf("--a" to "red", "--b" to "blue")
      )
    )
  }

  @Test
  fun `stops resolving fallbacks nested beyond the depth limit`() {
    // Deep enough to overflow the stack if every level were resolved recursively.
    val depth = 50_000
    val value = "var(--a, ".repeat(depth) + "red" + ")".repeat(depth)
    val result = substitute("""<rect fill="$value"/>""", mapOf("--z" to "blue"))
    val remaining = result.split("var(").size - 1
    assertTrue(result.contains("red"))
    assertEquals(depth - SVGVariables.MAX_FALLBACK_DEPTH, remaining)
  }

  @Test
  fun `keeps whitespace inside a multi-part fallback`() {
    assertEquals(
      """<rect stroke-dasharray="1 2 3"/>""",
      substitute("""<rect stroke-dasharray="var(--a, 1 2 3)"/>""", mapOf("--z" to "9"))
    )
  }

  @Test
  fun `treats an empty fallback as an empty value`() {
    assertEquals(
      """<rect fill=""/>""",
      substitute("""<rect fill="var(--a, )"/>""", mapOf("--b" to "red"))
    )
  }

  // endregion
  // region unresolved variables

  @Test
  fun `drops the attribute when the whole value is unresolved`() {
    // Dropping it lets the renderer apply its own default, rather than seeing a value it cannot
    // parse.
    assertEquals(
      """<svg><rect stroke="blue"/></svg>""",
      substitute("""<svg><rect fill="var(--a)" stroke="blue"/></svg>""", mapOf("--b" to "red"))
    )
  }

  @Test
  fun `keeps the attribute when only part of the value is unresolved`() {
    assertEquals(
      """<rect stroke-dasharray=" 2"/>""",
      substitute("""<rect stroke-dasharray="var(--a) 2"/>""", mapOf("--b" to "red"))
    )
  }

  @Test
  fun `leaves a var() that is not a custom property alone`() {
    assertEquals(
      """<rect fill="var(notacustomprop, red)"/>""",
      substitute("""<rect fill="var(notacustomprop, red)"/>""", mapOf("--a" to "blue"))
    )
  }

  // endregion
  // region regions that must not be rewritten

  @Test
  fun `leaves text content alone`() {
    assertEquals(
      """<svg><text>var(--a, #000)</text></svg>""",
      substitute("""<svg><text>var(--a, #000)</text></svg>""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `leaves comments alone`() {
    assertEquals(
      """<svg><!-- fill="var(--a, #000)" --><rect fill="red"/></svg>""",
      substitute(
        """<svg><!-- fill="var(--a, #000)" --><rect fill="var(--a, #000)"/></svg>""",
        mapOf("--a" to "red")
      )
    )
  }

  @Test
  fun `leaves CDATA alone`() {
    assertEquals(
      """<svg><![CDATA[var(--a, #000)]]></svg>""",
      substitute("""<svg><![CDATA[var(--a, #000)]]></svg>""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `leaves the xml declaration and doctype alone`() {
    assertEquals(
      """<?xml version="1.0"?><rect fill="red"/>""",
      substitute("""<?xml version="1.0"?><rect fill="var(--a, #000)"/>""", mapOf("--a" to "red"))
    )
    assertEquals(
      """<!DOCTYPE svg PUBLIC "x" "y"><rect fill="red"/>""",
      substitute(
        """<!DOCTYPE svg PUBLIC "x" "y"><rect fill="var(--a,#000)"/>""",
        mapOf("--a" to "red")
      )
    )
  }

  @Test
  fun `preserves entity references elsewhere in the document`() {
    assertEquals(
      """<svg><desc>a &amp; b</desc><rect fill="red"/></svg>""",
      substitute(
        """<svg><desc>a &amp; b</desc><rect fill="var(--a,#000)"/></svg>""",
        mapOf("--a" to "red")
      )
    )
  }

  // endregion
  // region style elements

  @Test
  fun `substitutes inside a style body`() {
    assertEquals(
      """<svg><style>.wall { fill: red }</style></svg>""",
      substitute("""<svg><style>.wall { fill: var(--a, #000) }</style></svg>""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `substitutes non-color declarations in a style body`() {
    assertEquals(
      "<style>.m { display: none; stroke-width: 3; }</style>",
      substitute(
        "<style>.m { display: var(--marker, inline); stroke-width: var(--w, 1); }</style>",
        mapOf("--marker" to "none", "--w" to "3")
      )
    )
  }

  @Test
  fun `leaves an unresolved declaration empty so it is ignored`() {
    assertEquals(
      """<svg><style>.wall { fill:  }</style></svg>""",
      substitute("""<svg><style>.wall { fill: var(--a) }</style></svg>""", mapOf("--b" to "red"))
    )
  }

  @Test
  fun `handles a style element with attributes`() {
    assertEquals(
      """<style type="text/css">rect { fill: red }</style>""",
      substitute(
        """<style type="text/css">rect { fill: var(--a, #000) }</style>""",
        mapOf("--a" to "red")
      )
    )
  }

  @Test
  fun `handles an uppercase closing tag`() {
    assertEquals(
      """<svg><STYLE>rect{fill:red}</STYLE><rect fill="red"/></svg>""",
      substitute(
        """<svg><STYLE>rect{fill:var(--a,#000)}</STYLE><rect fill="var(--a,#000)"/></svg>""",
        mapOf("--a" to "red")
      )
    )
  }

  @Test
  fun `does not swallow the document after a self-closing style element`() {
    assertEquals(
      """<svg><style/><rect fill="red"/></svg>""",
      substitute("""<svg><style/><rect fill="var(--a,#000)"/></svg>""", mapOf("--a" to "red"))
    )
  }

  // endregion
  // region degenerate input

  @Test
  fun `copies an unbalanced var() verbatim`() {
    assertEquals(
      """<rect fill="var(--a"/>""",
      substitute("""<rect fill="var(--a"/>""", mapOf("--a" to "red"))
    )
  }

  @Test
  fun `resolves fallbacks for an empty variable map`() {
    assertEquals(
      """<rect fill="#000"/>""",
      substitute("""<rect fill="var(--a, #000)" stroke="var(--b)"/>""", emptyMap())
    )
  }

  // endregion
  // region escaping caller-supplied values

  @Test
  fun `escapes xml metacharacters in a value`() {
    // Unescaped, `A & B` would make the document malformed and fail the whole load.
    assertEquals(
      """<rect fill="A &amp; B"/>""",
      substitute("""<rect fill="var(--a)"/>""", mapOf("--a" to "A & B"))
    )
  }

  @Test
  fun `a value cannot close its attribute and add another`() {
    assertEquals(
      """<rect fill="red&quot; transform=&quot;scale(9)"/>""",
      substitute("""<rect fill="var(--a)"/>""", mapOf("--a" to """red" transform="scale(9)"""))
    )
  }

  @Test
  fun `a value cannot close its element and add markup`() {
    val injected = substitute(
      """<svg><rect fill="var(--a)"/></svg>""",
      mapOf("--a" to """red"/><script/>""")
    )
    assertFalse(injected.contains("<script"))
    assertEquals("""<svg><rect fill="red&quot;/&gt;&lt;script/&gt;"/></svg>""", injected)
  }

  @Test
  fun `escapes single quotes so a single-quoted attribute survives`() {
    assertEquals(
      "<rect fill='it&apos;s red'/>",
      substitute("<rect fill='var(--a)'/>", mapOf("--a" to "it's red"))
    )
  }

  @Test
  fun `leaves an ordinary css value untouched`() {
    assertEquals(
      """<rect fill="rgb(0, 0, 0)"/>""",
      substitute("""<rect fill="var(--a)"/>""", mapOf("--a" to "rgb(0, 0, 0)"))
    )
  }

  @Test
  fun `does not escape a fallback, which is already document text`() {
    // The fallback came from the document, so its entities are correct as written.
    assertEquals(
      """<rect fill="A &amp; B"/>""",
      substitute("""<rect fill="var(--a, A &amp; B)"/>""", mapOf("--z" to "x"))
    )
  }

  @Test
  fun `rejects a style value that could escape its rule`() {
    // `}` would close the rule and let the value add selectors of its own.
    assertEquals(
      """<style>.a { fill:  }</style>""",
      substitute("""<style>.a { fill: var(--a) }</style>""", mapOf("--a" to "red } .b { fill: blue"))
    )
  }

  @Test
  fun `rejects a value that could add declarations to a style attribute`() {
    // A `style` attribute is a declaration list too, so `;` would let the value set other properties.
    assertEquals(
      """<rect style="fill: ; stroke: black"/>""",
      substitute("""<rect style="fill: var(--a); stroke: black"/>""", mapOf("--a" to "red; stroke: none"))
    )
    // Other attributes keep their semicolons, which some of them use as separators.
    assertEquals(
      """<animate values="0;1"/>""",
      substitute("""<animate values="var(--v)"/>""", mapOf("--v" to "0;1"))
    )
  }

  @Test
  fun `escapes metacharacters inside a style body`() {
    assertEquals(
      """<style>.a { fill: A &amp; B }</style>""",
      substitute("""<style>.a { fill: var(--a) }</style>""", mapOf("--a" to "A & B"))
    )
  }

  // endregion

  // region documents without supplied variables

  @Test
  fun `resolves fallbacks in a document that uses var()`() {
    assertEquals(
      """<svg><rect fill="#000"/></svg>""",
      SVGVariables.resolveFallbacks("""<svg><rect fill="var(--a, #000)" stroke="var(--b)"/></svg>""")
    )
  }

  @Test
  fun `returns a document without var() untouched`() {
    val source = """<svg><rect fill="#123456"/></svg>"""
    assertEquals(source, SVGVariables.resolveFallbacks(source))
  }

  // endregion
}
