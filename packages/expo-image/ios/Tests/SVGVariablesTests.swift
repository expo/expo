import Foundation
import Testing

@testable import ExpoImage

private func substitute(_ source: String, _ variables: [String: String]) -> String {
  return SVGVariables.substitute(in: source, variables: variables)
}

@Suite("SVG variables")
struct SVGVariablesTests {
  @Suite("attribute values")
  struct AttributeTests {
    @Test
    func `substitutes a supplied value`() {
      #expect(substitute(##"<svg><rect fill="var(--a, #000)"/></svg>"##, ["--a": "red"])
        == ##"<svg><rect fill="red"/></svg>"##)
    }

    @Test
    func `uses the fallback when the variable is not supplied`() {
      #expect(substitute(##"<svg><rect fill="var(--a, #000)"/></svg>"##, ["--b": "red"])
        == ##"<svg><rect fill="#000"/></svg>"##)
    }

    @Test
    func `leaves a document without variables untouched`() {
      #expect(substitute(##"<svg><rect fill="#123456"/></svg>"##, ["--a": "red"])
        == ##"<svg><rect fill="#123456"/></svg>"##)
    }

    @Test
    func `substitutes values that are not colors`() {
      #expect(substitute(##"<rect stroke-width="var(--w, 1)"/>"##, ["--w": "4"])
        == ##"<rect stroke-width="4"/>"##)
      #expect(substitute(##"<rect opacity="var(--o, 1)"/>"##, ["--o": "0.25"])
        == ##"<rect opacity="0.25"/>"##)
    }

    @Test
    func `substitutes several references in one value`() {
      #expect(substitute(##"<rect stroke-dasharray="var(--a, 1) var(--b, 2)"/>"##, ["--a": "5", "--b": "6"])
        == ##"<rect stroke-dasharray="5 6"/>"##)
      #expect(substitute(##"<rect stroke-dasharray="var(--a, 1) var(--b, 2)"/>"##, ["--a": "5"])
        == ##"<rect stroke-dasharray="5 2"/>"##)
    }

    @Test
    func `preserves the quote style and surrounding whitespace`() {
      #expect(substitute(##"<rect fill='var(--a, #000)'/>"##, ["--a": "red"])
        == ##"<rect fill='red'/>"##)
      #expect(substitute(##"<rect   fill = "var(--a, #000)"   stroke="b"  />"##, ["--a": "red"])
        == ##"<rect   fill = "red"   stroke="b"  />"##)
    }

    @Test
    func `does not treat a greater-than inside a value as the end of the tag`() {
      #expect(substitute(##"<rect data-x="a>b" fill="var(--a,#000)"/>"##, ["--a": "red"])
        == ##"<rect data-x="a>b" fill="red"/>"##)
    }
  }

  @Suite("fallbacks")
  struct FallbackTests {
    @Test
    func `allows commas inside a fallback`() {
      #expect(substitute(##"<rect fill="var(--a, rgb(0, 0, 0))"/>"##, ["--z": "x"])
        == ##"<rect fill="rgb(0, 0, 0)"/>"##)
    }

    @Test
    func `resolves a nested variable in the fallback`() {
      #expect(substitute(##"<rect fill="var(--a, var(--b, green))"/>"##, ["--b": "blue"])
        == ##"<rect fill="blue"/>"##)
    }

    @Test
    func `falls through nested fallbacks to the literal`() {
      #expect(substitute(##"<rect fill="var(--a, var(--b, green))"/>"##, ["--c": "blue"])
        == ##"<rect fill="green"/>"##)
    }

    @Test
    func `prefers the outer value over a nested fallback`() {
      #expect(substitute(##"<rect fill="var(--a, var(--b, green))"/>"##, ["--a": "red", "--b": "blue"])
        == ##"<rect fill="red"/>"##)
    }

    @Test
    func `keeps whitespace inside a multi-part fallback`() {
      #expect(substitute(##"<rect stroke-dasharray="var(--a, 1 2 3)"/>"##, ["--z": "9"])
        == ##"<rect stroke-dasharray="1 2 3"/>"##)
    }

    @Test
    func `treats an empty fallback as an empty value`() {
      #expect(substitute(##"<rect fill="var(--a, )"/>"##, ["--b": "red"])
        == ##"<rect fill=""/>"##)
    }
  }

  @Suite("unresolved variables")
  struct UnresolvedTests {
    @Test
    func `drops the attribute when the whole value is unresolved`() {
      // Dropping it lets the renderer apply its own default, rather than seeing a value it
      // cannot parse.
      #expect(substitute(##"<svg><rect fill="var(--a)" stroke="blue"/></svg>"##, ["--b": "red"])
        == ##"<svg><rect stroke="blue"/></svg>"##)
    }

    @Test
    func `keeps the attribute when only part of the value is unresolved`() {
      #expect(substitute(##"<rect stroke-dasharray="var(--a) 2"/>"##, ["--b": "red"])
        == ##"<rect stroke-dasharray=" 2"/>"##)
    }

    @Test
    func `leaves a var() that is not a custom property alone`() {
      #expect(substitute(##"<rect fill="var(notacustomprop, red)"/>"##, ["--a": "blue"])
        == ##"<rect fill="var(notacustomprop, red)"/>"##)
    }
  }

  @Suite("regions that must not be rewritten")
  struct PassthroughTests {
    @Test
    func `leaves text content alone`() {
      #expect(substitute(##"<svg><text>var(--a, #000)</text></svg>"##, ["--a": "red"])
        == ##"<svg><text>var(--a, #000)</text></svg>"##)
    }

    @Test
    func `leaves comments alone`() {
      #expect(substitute(##"<svg><!-- fill="var(--a, #000)" --><rect fill="var(--a, #000)"/></svg>"##, ["--a": "red"])
        == ##"<svg><!-- fill="var(--a, #000)" --><rect fill="red"/></svg>"##)
    }

    @Test
    func `leaves CDATA alone`() {
      #expect(substitute(##"<svg><![CDATA[var(--a, #000)]]></svg>"##, ["--a": "red"])
        == ##"<svg><![CDATA[var(--a, #000)]]></svg>"##)
    }

    @Test
    func `leaves the xml declaration and doctype alone`() {
      #expect(substitute(##"<?xml version="1.0"?><rect fill="var(--a, #000)"/>"##, ["--a": "red"])
        == ##"<?xml version="1.0"?><rect fill="red"/>"##)
      #expect(substitute(##"<!DOCTYPE svg PUBLIC "x" "y"><rect fill="var(--a,#000)"/>"##, ["--a": "red"])
        == ##"<!DOCTYPE svg PUBLIC "x" "y"><rect fill="red"/>"##)
    }

    @Test
    func `preserves entity references elsewhere in the document`() {
      #expect(substitute(##"<svg><desc>a &amp; b</desc><rect fill="var(--a,#000)"/></svg>"##, ["--a": "red"])
        == ##"<svg><desc>a &amp; b</desc><rect fill="red"/></svg>"##)
    }
  }

  @Suite("style elements")
  struct StyleTests {
    @Test
    func `substitutes inside a style body`() {
      #expect(substitute(##"<svg><style>.wall { fill: var(--a, #000) }</style></svg>"##, ["--a": "red"])
        == ##"<svg><style>.wall { fill: red }</style></svg>"##)
    }

    @Test
    func `leaves an unresolved declaration empty so it is ignored`() {
      #expect(substitute(##"<svg><style>.wall { fill: var(--a) }</style></svg>"##, ["--b": "red"])
        == ##"<svg><style>.wall { fill:  }</style></svg>"##)
    }

    @Test
    func `handles a style element with attributes`() {
      #expect(substitute(##"<style type="text/css">rect { fill: var(--a, #000) }</style>"##, ["--a": "red"])
        == ##"<style type="text/css">rect { fill: red }</style>"##)
    }

    @Test
    func `handles an uppercase closing tag`() {
      #expect(substitute(##"<svg><STYLE>rect{fill:var(--a,#000)}</STYLE><rect fill="var(--a,#000)"/></svg>"##, ["--a": "red"])
        == ##"<svg><STYLE>rect{fill:red}</STYLE><rect fill="red"/></svg>"##)
    }

    @Test
    func `does not swallow the document after a self-closing style element`() {
      #expect(substitute(##"<svg><style/><rect fill="var(--a,#000)"/></svg>"##, ["--a": "red"])
        == ##"<svg><style/><rect fill="red"/></svg>"##)
    }
  }

  @Suite("degenerate input")
  struct DegenerateTests {
    @Test
    func `copies an unbalanced var() verbatim`() {
      #expect(substitute(##"<rect fill="var(--a"/>"##, ["--a": "red"])
        == ##"<rect fill="var(--a"/>"##)
    }

    @Test
    func `is a no-op for an empty variable map`() {
      #expect(substitute(##"<rect fill="var(--a, #000)"/>"##, [:])
        == ##"<rect fill="var(--a, #000)"/>"##)
    }
  }

  @Suite("escaping caller-supplied values")
  struct EscapingTests {
    @Test
    func `escapes xml metacharacters in a value`() {
      // Unescaped, `A & B` would make the document malformed and fail the whole load.
      #expect(substitute(##"<rect fill="var(--a)"/>"##, ["--a": "A & B"])
        == ##"<rect fill="A &amp; B"/>"##)
    }

    @Test
    func `a value cannot close its attribute and add another`() {
      #expect(substitute(##"<rect fill="var(--a)"/>"##, ["--a": ##"red" transform="scale(9)"##])
        == ##"<rect fill="red&quot; transform=&quot;scale(9)"/>"##)
    }

    @Test
    func `a value cannot close its element and add markup`() {
      let injected = substitute(##"<svg><rect fill="var(--a)"/></svg>"##, ["--a": ##"red"/><script/>"##])
      #expect(!injected.contains("<script"))
      #expect(injected == ##"<svg><rect fill="red&quot;/&gt;&lt;script/&gt;"/></svg>"##)
    }

    @Test
    func `escapes single quotes so a single-quoted attribute survives`() {
      #expect(substitute("<rect fill='var(--a)'/>", ["--a": "it's red"])
        == "<rect fill='it&apos;s red'/>")
    }

    @Test
    func `leaves an ordinary css value untouched`() {
      #expect(substitute(##"<rect fill="var(--a)"/>"##, ["--a": "rgb(0, 0, 0)"])
        == ##"<rect fill="rgb(0, 0, 0)"/>"##)
    }

    @Test
    func `does not escape a fallback, which is already document text`() {
      // The fallback came from the document, so its entities are correct as written.
      #expect(substitute(##"<rect fill="var(--a, A &amp; B)"/>"##, ["--z": "x"])
        == ##"<rect fill="A &amp; B"/>"##)
    }

    @Test
    func `rejects a style value that could escape its rule`() {
      // `}` would close the rule and let the value add selectors of its own.
      #expect(substitute(##"<style>.a { fill: var(--a) }</style>"##, ["--a": "red } .b { fill: blue"])
        == ##"<style>.a { fill:  }</style>"##)
    }

    @Test
    func `escapes metacharacters inside a style body`() {
      #expect(substitute(##"<style>.a { fill: var(--a) }</style>"##, ["--a": "A & B"])
        == ##"<style>.a { fill: A &amp; B }</style>"##)
    }
  }

  @Suite("data")
  struct DataTests {
    @Test
    func `round trips utf8 data`() {
      let data = Data(##"<rect fill="var(--a,#000)"/>"##.utf8)
      let result = SVGVariables.substitute(in: data, variables: ["--a": "red"])
      #expect(String(data: result, encoding: .utf8) == ##"<rect fill="red"/>"##)
    }

    @Test
    func `returns data that is not valid utf8 untouched`() {
      // Re-encoding a document that declares another encoding would make its own declaration lie.
      let data = Data([0xFF, 0xFE, 0x00, 0x41])
      #expect(SVGVariables.substitute(in: data, variables: ["--a": "red"]) == data)
    }
  }
}
