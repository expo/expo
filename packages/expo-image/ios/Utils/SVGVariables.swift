// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// Substitutes CSS custom properties — `var(--name)` and `var(--name, fallback)` — in an SVG
/// document with caller-provided values, before the document is handed to a renderer.
///
/// Rewriting the source text, rather than asking the renderer to resolve the variables, has two
/// properties we want. It keeps the vector rendering path intact — tinting an SVG no longer has to
/// rasterize it — and it works no matter whether the underlying renderer understands custom
/// properties at all. Apple's CoreSVG does not.
///
/// Substitution happens only inside quoted attribute values and `<style>` element bodies, the two
/// places a custom property can legally appear. Text content, comments, CDATA sections, the XML
/// declaration and the doctype are copied verbatim, so a literal `var(--x)` written inside a
/// `<text>` element survives untouched.
internal enum SVGVariables {
  /// Substitutes the variables in a UTF-8 encoded SVG document.
  ///
  /// Returns the original data unchanged when there is nothing to do, or when the data is not valid
  /// UTF-8. Re-encoding a document that declares a different encoding in its XML declaration would
  /// make that declaration lie about its own contents, so those are deliberately left alone.
  static func substitute(in data: Data, variables: [String: String]) -> Data {
    guard !variables.isEmpty, let source = String(data: data, encoding: .utf8) else {
      return data
    }
    return Data(substitute(in: source, variables: variables).utf8)
  }

  static func substitute(in source: String, variables: [String: String]) -> String {
    guard !variables.isEmpty else {
      return source
    }
    let chars = Array(source)
    var out = ""
    out.reserveCapacity(chars.count)
    var index = 0

    while index < chars.count {
      guard chars[index] == "<" else {
        out.append(chars[index])
        index += 1
        continue
      }
      // Everything that isn't an element tag is copied through verbatim.
      if let terminator = passthroughTerminator(chars, at: index) {
        index = copy(chars, from: index, throughFirst: terminator, into: &out)
        continue
      }

      let tagName = readName(chars, from: index + 1).lowercased()
      let tagEnd = endOfTag(chars, from: index)
      out += substituteTag(chars, in: index..<tagEnd, variables: variables)
      index = tagEnd

      // A `<style>` body is CSS, not markup, so it gets scanned as one value instead of as a tag.
      if tagName == "style", !isSelfClosing(chars, tag: index) {
        index = copyStyleBody(chars, from: index, variables: variables, into: &out)
      }
    }
    return out
  }

  // MARK: - Document scanning

  /// The terminator that ends a non-element construct starting at `index`, or `nil` for element tags.
  private static func passthroughTerminator(_ chars: [Character], at index: Int) -> String? {
    if matches(chars, at: index, "<!--") {
      return "-->"
    }
    if matches(chars, at: index, "<![CDATA[") {
      return "]]>"
    }
    if matches(chars, at: index, "<?") {
      return "?>"
    }
    // Doctype and other declarations.
    if matches(chars, at: index, "<!") {
      return ">"
    }
    return nil
  }

  private static func copy(
    _ chars: [Character],
    from start: Int,
    throughFirst terminator: String,
    into out: inout String
  ) -> Int {
    let end = firstIndex(of: terminator, in: chars, from: start).map { $0 + terminator.count } ?? chars.count
    out.append(contentsOf: chars[start..<end])
    return end
  }

  private static func copyStyleBody(
    _ chars: [Character],
    from start: Int,
    variables: [String: String],
    into out: inout String
  ) -> Int {
    let end = firstIndex(ofCaseInsensitive: "</style", in: chars, from: start) ?? chars.count
    let body = Array(chars[start..<end])
    out += substituteValue(body, variables: variables).text
    return end
  }

  /// The index just past the `>` that closes the tag starting at `start`.
  private static func endOfTag(_ chars: [Character], from start: Int) -> Int {
    var index = start + 1
    var quote: Character?

    while index < chars.count {
      let char = chars[index]
      if let open = quote {
        if char == open {
          quote = nil
        }
      } else if char == "\"" || char == "'" {
        quote = char
      } else if char == ">" {
        return index + 1
      }
      index += 1
    }
    return chars.count
  }

  private static func isSelfClosing(_ chars: [Character], tag end: Int) -> Bool {
    var index = end - 2
    while index >= 0, chars[index].isWhitespace {
      index -= 1
    }
    return index >= 0 && chars[index] == "/"
  }

  // MARK: - Tag rewriting

  private struct Attribute {
    /// Whitespace before the name through the closing quote — the span to keep or drop wholesale.
    let fullRange: Range<Int>
    let valueRange: Range<Int>
  }

  /// Rewrites one element tag, substituting variables inside attribute values.
  ///
  /// An attribute whose entire value is a single unresolved variable with no fallback is dropped, so
  /// the renderer applies its own default for that property rather than seeing a value it cannot
  /// parse. Any tag this cannot confidently parse is copied through verbatim.
  private static func substituteTag(
    _ chars: [Character],
    in range: Range<Int>,
    variables: [String: String]
  ) -> String {
    let verbatim = String(chars[range])
    var index = range.lowerBound + 1

    // The element name.
    while index < range.upperBound, !chars[index].isWhitespace, chars[index] != ">", chars[index] != "/" {
      index += 1
    }
    let prefixEnd = index

    var attributes: [Attribute] = []
    while index < range.upperBound {
      let whitespaceStart = index
      while index < range.upperBound, chars[index].isWhitespace {
        index += 1
      }
      // The tag's own closing characters — no attributes left.
      if index >= range.upperBound || chars[index] == ">" || chars[index] == "/" {
        index = whitespaceStart
        break
      }
      guard let attribute = readAttribute(chars, from: whitespaceStart, limit: range.upperBound) else {
        // Something we don't understand — don't risk mangling it.
        return verbatim
      }
      attributes.append(attribute)
      index = attribute.fullRange.upperBound
    }

    var out = String(chars[range.lowerBound..<prefixEnd])
    for attribute in attributes {
      let value = substituteValue(Array(chars[attribute.valueRange]), variables: variables)
      if value.isEntirelyUnresolved {
        continue
      }
      out += String(chars[attribute.fullRange.lowerBound..<attribute.valueRange.lowerBound])
      out += value.text
      out += String(chars[attribute.valueRange.upperBound..<attribute.fullRange.upperBound])
    }
    out += String(chars[index..<range.upperBound])
    return out
  }

  /// Parses ` name = "value"` starting at the leading whitespace. Only quoted values are accepted.
  private static func readAttribute(_ chars: [Character], from start: Int, limit: Int) -> Attribute? {
    var index = start
    while index < limit, chars[index].isWhitespace {
      index += 1
    }
    let nameStart = index
    while index < limit, !chars[index].isWhitespace, chars[index] != "=", chars[index] != ">", chars[index] != "/" {
      index += 1
    }
    guard index > nameStart else {
      return nil
    }
    while index < limit, chars[index].isWhitespace {
      index += 1
    }
    guard index < limit, chars[index] == "=" else {
      return nil
    }
    index += 1
    while index < limit, chars[index].isWhitespace {
      index += 1
    }
    guard index < limit, chars[index] == "\"" || chars[index] == "'" else {
      return nil
    }
    let quote = chars[index]
    let valueStart = index + 1
    index = valueStart
    while index < limit, chars[index] != quote {
      index += 1
    }
    guard index < limit else {
      return nil
    }
    return Attribute(fullRange: start..<(index + 1), valueRange: valueStart..<index)
  }

  // MARK: - Value substitution

  private struct SubstitutedValue {
    let text: String
    /// The whole value was a single `var()` that resolved to nothing and declared no fallback.
    let isEntirelyUnresolved: Bool
  }

  private enum Resolution {
    case resolved(String)
    /// No value supplied and no usable fallback.
    case unresolved
    /// Not a custom property reference at all — leave the source text alone.
    case verbatim
  }

  /// Replaces every `var()` reference in a value. Handles nested fallbacks (`var(--a, var(--b, red))`),
  /// commas inside fallbacks (`var(--a, rgb(0, 0, 0))`) and several references in one value
  /// (`var(--a, 1) var(--b, 2)`).
  private static func substituteValue(_ value: [Character], variables: [String: String]) -> SubstitutedValue {
    var out = ""
    var index = 0
    var unresolvedSpan: Range<Int>?
    var substitutions = 0

    while index < value.count {
      guard matches(value, at: index, "var("), let close = matchingParen(value, openParen: index + 3) else {
        out.append(value[index])
        index += 1
        continue
      }
      let span = index..<(close + 1)
      let inner = Array(value[(index + 4)..<close])

      switch resolve(inner, variables: variables) {
      case .resolved(let text):
        out += text
        substitutions += 1
      case .unresolved:
        // Contributes nothing. A value left partially empty is invalid, which renderers ignore.
        unresolvedSpan = span
        substitutions += 1
      case .verbatim:
        out += String(value[span])
      }
      index = close + 1
    }

    // Only report a droppable value when the single unresolved reference *was* the entire value.
    let isEntirelyUnresolved = substitutions == 1
      && unresolvedSpan.map { isOnlyContent(of: value, in: $0) } == true
    return SubstitutedValue(text: out, isEntirelyUnresolved: isEntirelyUnresolved)
  }

  private static func resolve(_ inner: [Character], variables: [String: String]) -> Resolution {
    let (namePart, fallbackPart) = splitAtTopLevelComma(inner)
    let name = String(namePart).trimmingCharacters(in: .whitespacesAndNewlines)

    guard name.hasPrefix("--") else {
      return .verbatim
    }
    if let value = variables[name] {
      return .resolved(value)
    }
    guard let fallbackPart else {
      return .unresolved
    }
    // A fallback may itself reference other variables.
    let fallback = substituteValue(fallbackPart, variables: variables)
    if fallback.isEntirelyUnresolved {
      return .unresolved
    }
    return .resolved(fallback.text.trimmingCharacters(in: .whitespacesAndNewlines))
  }

  /// Splits `--name, fallback` into its two parts, ignoring commas nested inside parentheses.
  private static func splitAtTopLevelComma(_ chars: [Character]) -> (ArraySlice<Character>, [Character]?) {
    var depth = 0
    for (offset, char) in chars.enumerated() {
      if char == "(" {
        depth += 1
      } else if char == ")" {
        depth -= 1
      } else if char == "," && depth == 0 {
        return (chars[0..<offset], Array(chars[(offset + 1)...]))
      }
    }
    return (chars[0...], nil)
  }

  /// The index of the `)` matching an open paren, accounting for nesting.
  private static func matchingParen(_ chars: [Character], openParen: Int) -> Int? {
    guard openParen < chars.count, chars[openParen] == "(" else {
      return nil
    }
    var depth = 0
    var index = openParen
    while index < chars.count {
      if chars[index] == "(" {
        depth += 1
      } else if chars[index] == ")" {
        depth -= 1
        if depth == 0 {
          return index
        }
      }
      index += 1
    }
    return nil
  }

  // MARK: - Character helpers

  private static func matches(_ chars: [Character], at index: Int, _ needle: String) -> Bool {
    let needleChars = Array(needle)
    guard index + needleChars.count <= chars.count else {
      return false
    }
    return Array(chars[index..<(index + needleChars.count)]) == needleChars
  }

  private static func readName(_ chars: [Character], from start: Int) -> String {
    var index = start
    while index < chars.count, !chars[index].isWhitespace, chars[index] != ">", chars[index] != "/" {
      index += 1
    }
    return String(chars[start..<index])
  }

  private static func firstIndex(of needle: String, in chars: [Character], from start: Int) -> Int? {
    let needleChars = Array(needle)
    let last = chars.count - needleChars.count
    guard !needleChars.isEmpty, start <= last else {
      return nil
    }
    for index in start...last where matches(chars, at: index, needle) {
      return index
    }
    return nil
  }

  /// Case-insensitive search, comparing character by character. Lowercasing the whole document first
  /// would be simpler but is not index-safe — for some scripts `lowercased()` changes the length of
  /// the string, which would misalign every index that follows.
  private static func firstIndex(ofCaseInsensitive needle: String, in chars: [Character], from start: Int) -> Int? {
    let needleChars = Array(needle.lowercased())
    let last = chars.count - needleChars.count
    guard !needleChars.isEmpty, start <= last else {
      return nil
    }
    for index in start...last {
      let candidate = chars[index..<(index + needleChars.count)]
      if candidate.elementsEqual(needleChars, by: { $0.lowercased() == String($1) }) {
        return index
      }
    }
    return nil
  }

  /// Whether everything outside `span` is whitespace.
  private static func isOnlyContent(of chars: [Character], in span: Range<Int>) -> Bool {
    for (offset, char) in chars.enumerated() where !span.contains(offset) && !char.isWhitespace {
      return false
    }
    return true
  }
}
