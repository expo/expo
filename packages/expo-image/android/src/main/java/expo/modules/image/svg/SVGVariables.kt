package expo.modules.image.svg

/**
 * Substitutes CSS custom properties — `var(--name)` and `var(--name, fallback)` — in an SVG
 * document with caller-provided values, before the document is handed to a parser.
 *
 * Rewriting the source text, rather than asking the renderer to resolve the variables, keeps this
 * independent of what the renderer supports. AndroidSVG has a CSS selector engine but no support
 * for custom properties, and Apple's CoreSVG has neither, so neither platform could resolve
 * `var()` on its own.
 *
 * Substitution happens only inside quoted attribute values and `<style>` element bodies, the two
 * places a custom property can legally appear. Text content, comments, CDATA sections, the XML
 * declaration and the doctype are copied verbatim, so a literal `var(--x)` written inside a
 * `<text>` element survives untouched.
 *
 * This mirrors `SVGVariables.swift` on iOS. The two are driven by the same expectations, so a
 * change to one belongs in the other.
 */
object SVGVariables {
  /**
   * Substitutes the variables in an SVG document.
   */
  fun substitute(source: String, variables: Map<String, String>): String {
    if (variables.isEmpty()) {
      return source
    }
    val chars = source.toCharArray()
    val out = StringBuilder(chars.size)
    var index = 0

    while (index < chars.size) {
      if (chars[index] != '<') {
        out.append(chars[index])
        index += 1
        continue
      }
      // Everything that isn't an element tag is copied through verbatim.
      val terminator = passthroughTerminator(chars, index)
      if (terminator != null) {
        index = copyThroughFirst(chars, index, terminator, out)
        continue
      }

      val tagName = readName(chars, index + 1).lowercase()
      val tagEnd = endOfTag(chars, index)
      out.append(substituteTag(chars, index, tagEnd, variables))
      index = tagEnd

      // A `<style>` body is CSS, not markup, so it gets scanned as one value instead of as a tag.
      if (tagName == "style" && !isSelfClosing(chars, tagEnd)) {
        index = copyStyleBody(chars, index, variables, out)
      }
    }
    return out.toString()
  }

  // MARK: - Document scanning

  /** The terminator that ends a non-element construct at [index], or null for element tags. */
  private fun passthroughTerminator(chars: CharArray, index: Int): String? = when {
    matches(chars, index, "<!--") -> "-->"
    matches(chars, index, "<![CDATA[") -> "]]>"
    matches(chars, index, "<?") -> "?>"
    // Doctype and other declarations.
    matches(chars, index, "<!") -> ">"
    else -> null
  }

  private fun copyThroughFirst(chars: CharArray, start: Int, terminator: String, out: StringBuilder): Int {
    val found = indexOf(chars, terminator, start)
    val end = if (found == -1) chars.size else found + terminator.length
    out.append(chars, start, end - start)
    return end
  }

  private fun copyStyleBody(
    chars: CharArray,
    start: Int,
    variables: Map<String, String>,
    out: StringBuilder
  ): Int {
    val found = indexOfIgnoreCase(chars, "</style", start)
    val end = if (found == -1) chars.size else found
    out.append(substituteValue(chars, start, end, variables, Context.STYLE_BODY).text)
    return end
  }

  /** The index just past the `>` that closes the tag starting at [start]. */
  private fun endOfTag(chars: CharArray, start: Int): Int {
    var index = start + 1
    var quote: Char? = null

    while (index < chars.size) {
      val char = chars[index]
      when {
        quote != null -> if (char == quote) quote = null
        char == '"' || char == '\'' -> quote = char
        char == '>' -> return index + 1
      }
      index += 1
    }
    return chars.size
  }

  private fun isSelfClosing(chars: CharArray, tagEnd: Int): Boolean {
    var index = tagEnd - 2
    while (index >= 0 && chars[index].isWhitespace()) {
      index -= 1
    }
    return index >= 0 && chars[index] == '/'
  }

  // MARK: - Tag rewriting

  /** Whitespace before the name through the closing quote — the span to keep or drop wholesale. */
  private class Attribute(val start: Int, val end: Int, val valueStart: Int, val valueEnd: Int)

  /**
   * Rewrites one element tag, substituting variables inside attribute values.
   *
   * An attribute whose entire value is a single unresolved variable with no fallback is dropped, so
   * the renderer applies its own default for that property rather than seeing a value it cannot
   * parse. Any tag this cannot confidently parse is copied through verbatim.
   */
  private fun substituteTag(
    chars: CharArray,
    start: Int,
    end: Int,
    variables: Map<String, String>
  ): String {
    var index = start + 1

    // The element name.
    while (index < end && !chars[index].isWhitespace() && chars[index] != '>' && chars[index] != '/') {
      index += 1
    }
    val prefixEnd = index

    val attributes = mutableListOf<Attribute>()
    while (index < end) {
      val whitespaceStart = index
      while (index < end && chars[index].isWhitespace()) {
        index += 1
      }
      // The tag's own closing characters — no attributes left.
      if (index >= end || chars[index] == '>' || chars[index] == '/') {
        index = whitespaceStart
        break
      }
      val attribute = readAttribute(chars, whitespaceStart, end)
        // Something we don't understand — don't risk mangling it.
        ?: return String(chars, start, end - start)
      attributes.add(attribute)
      index = attribute.end
    }

    val out = StringBuilder()
    out.append(chars, start, prefixEnd - start)
    for (attribute in attributes) {
      val value = substituteValue(chars, attribute.valueStart, attribute.valueEnd, variables, Context.ATTRIBUTE)
      if (value.isEntirelyUnresolved) {
        continue
      }
      out.append(chars, attribute.start, attribute.valueStart - attribute.start)
      out.append(value.text)
      out.append(chars, attribute.valueEnd, attribute.end - attribute.valueEnd)
    }
    out.append(chars, index, end - index)
    return out.toString()
  }

  /** Parses ` name = "value"` starting at the leading whitespace. Only quoted values are accepted. */
  private fun readAttribute(chars: CharArray, start: Int, limit: Int): Attribute? {
    var index = start
    while (index < limit && chars[index].isWhitespace()) {
      index += 1
    }
    val nameStart = index
    while (index < limit && !chars[index].isWhitespace() &&
      chars[index] != '=' && chars[index] != '>' && chars[index] != '/'
    ) {
      index += 1
    }
    if (index == nameStart) {
      return null
    }
    while (index < limit && chars[index].isWhitespace()) {
      index += 1
    }
    if (index >= limit || chars[index] != '=') {
      return null
    }
    index += 1
    while (index < limit && chars[index].isWhitespace()) {
      index += 1
    }
    if (index >= limit || (chars[index] != '"' && chars[index] != '\'')) {
      return null
    }
    val quote = chars[index]
    val valueStart = index + 1
    index = valueStart
    while (index < limit && chars[index] != quote) {
      index += 1
    }
    if (index >= limit) {
      return null
    }
    return Attribute(start = start, end = index + 1, valueStart = valueStart, valueEnd = index)
  }

  // MARK: - Value substitution

  private class SubstitutedValue(
    val text: String,
    /** The whole value was a single `var()` that resolved to nothing and declared no fallback. */
    val isEntirelyUnresolved: Boolean
  )

  /** Where a value is being written, which decides how it has to be escaped. */
  private enum class Context {
    ATTRIBUTE,
    STYLE_BODY
  }

  /**
   * Escapes a caller-supplied value so that it cannot terminate the attribute it sits in or add
   * markup of its own. Returns null for a value that can't be made safe, which the caller treats as
   * unresolved.
   *
   * Only values that came from the variable map go through this. Fallbacks are document text that is
   * already escaped, so escaping them again would double up their entities.
   */
  private fun escape(value: String, context: Context): String? {
    // Inside a stylesheet these could close the declaration or the rule and start another one. No
    // legitimate CSS value needs them.
    if (context == Context.STYLE_BODY && value.any { it == '{' || it == '}' || it == ';' }) {
      return null
    }
    val escaped = StringBuilder(value.length)
    for (char in value) {
      when (char) {
        '&' -> escaped.append("&amp;")
        '<' -> escaped.append("&lt;")
        '>' -> escaped.append("&gt;")
        '"' -> escaped.append("&quot;")
        '\'' -> escaped.append("&apos;")
        else -> escaped.append(char)
      }
    }
    return escaped.toString()
  }

  private sealed class Resolution {
    class Resolved(val text: String) : Resolution()

    /** No value supplied and no usable fallback. */
    object Unresolved : Resolution()

    /** Not a custom property reference at all — leave the source text alone. */
    object Verbatim : Resolution()
  }

  /**
   * Replaces every `var()` reference in a value. Handles nested fallbacks
   * (`var(--a, var(--b, red))`), commas inside fallbacks (`var(--a, rgb(0, 0, 0))`) and several
   * references in one value (`var(--a, 1) var(--b, 2)`).
   */
  private fun substituteValue(
    chars: CharArray,
    start: Int,
    end: Int,
    variables: Map<String, String>,
    context: Context
  ): SubstitutedValue {
    val out = StringBuilder()
    var index = start
    var unresolvedStart = -1
    var unresolvedEnd = -1
    var substitutions = 0

    while (index < end) {
      val closeParen = if (matches(chars, index, "var(")) matchingParen(chars, index + 3, end) else -1
      if (closeParen == -1) {
        out.append(chars[index])
        index += 1
        continue
      }
      when (val resolution = resolve(chars, index + 4, closeParen, variables, context)) {
        is Resolution.Resolved -> {
          out.append(resolution.text)
          substitutions += 1
        }

        is Resolution.Unresolved -> {
          // Contributes nothing. A value left partially empty is invalid, which renderers ignore.
          unresolvedStart = index
          unresolvedEnd = closeParen + 1
          substitutions += 1
        }

        is Resolution.Verbatim -> out.append(chars, index, closeParen + 1 - index)
      }
      index = closeParen + 1
    }

    // Only report a droppable value when the single unresolved reference *was* the entire value.
    val isEntirelyUnresolved = substitutions == 1 && unresolvedStart != -1 &&
      isOnlyContent(chars, start, end, unresolvedStart, unresolvedEnd)
    return SubstitutedValue(out.toString(), isEntirelyUnresolved)
  }

  private fun resolve(
    chars: CharArray,
    start: Int,
    end: Int,
    variables: Map<String, String>,
    context: Context
  ): Resolution {
    val commaIndex = topLevelCommaIndex(chars, start, end)
    val name = String(chars, start, (if (commaIndex == -1) end else commaIndex) - start).trim()

    if (!name.startsWith("--")) {
      return Resolution.Verbatim
    }
    variables[name]?.let { supplied ->
      val escaped = escape(supplied, context) ?: return Resolution.Unresolved
      return Resolution.Resolved(escaped)
    }
    if (commaIndex == -1) {
      return Resolution.Unresolved
    }
    // A fallback may itself reference other variables.
    val fallback = substituteValue(chars, commaIndex + 1, end, variables, context)
    if (fallback.isEntirelyUnresolved) {
      return Resolution.Unresolved
    }
    return Resolution.Resolved(fallback.text.trim())
  }

  /** The index of the comma separating `--name` from its fallback, ignoring nested parentheses. */
  private fun topLevelCommaIndex(chars: CharArray, start: Int, end: Int): Int {
    var depth = 0
    for (index in start until end) {
      when {
        chars[index] == '(' -> depth += 1
        chars[index] == ')' -> depth -= 1
        chars[index] == ',' && depth == 0 -> return index
      }
    }
    return -1
  }

  /** The index of the `)` matching an open paren, accounting for nesting. */
  private fun matchingParen(chars: CharArray, openParen: Int, limit: Int): Int {
    if (openParen >= limit || chars[openParen] != '(') {
      return -1
    }
    var depth = 0
    var index = openParen
    while (index < limit) {
      when (chars[index]) {
        '(' -> depth += 1
        ')' -> {
          depth -= 1
          if (depth == 0) {
            return index
          }
        }
      }
      index += 1
    }
    return -1
  }

  // MARK: - Character helpers

  private fun matches(chars: CharArray, index: Int, needle: String): Boolean {
    if (index + needle.length > chars.size) {
      return false
    }
    for (offset in needle.indices) {
      if (chars[index + offset] != needle[offset]) {
        return false
      }
    }
    return true
  }

  private fun readName(chars: CharArray, start: Int): String {
    var index = start
    while (index < chars.size && !chars[index].isWhitespace() &&
      chars[index] != '>' && chars[index] != '/'
    ) {
      index += 1
    }
    return String(chars, start, index - start)
  }

  private fun indexOf(chars: CharArray, needle: String, start: Int): Int {
    for (index in start..(chars.size - needle.length)) {
      if (matches(chars, index, needle)) {
        return index
      }
    }
    return -1
  }

  /**
   * Case-insensitive search, comparing character by character. Lowercasing the whole document first
   * would be simpler but is not index-safe — for some locales it can change the length of the
   * string, which would misalign every index that follows.
   */
  private fun indexOfIgnoreCase(chars: CharArray, needle: String, start: Int): Int {
    for (index in start..(chars.size - needle.length)) {
      var matched = true
      for (offset in needle.indices) {
        if (chars[index + offset].lowercaseChar() != needle[offset].lowercaseChar()) {
          matched = false
          break
        }
      }
      if (matched) {
        return index
      }
    }
    return -1
  }

  /** Whether everything in `start until end` outside the span is whitespace. */
  private fun isOnlyContent(
    chars: CharArray,
    start: Int,
    end: Int,
    spanStart: Int,
    spanEnd: Int
  ): Boolean {
    for (index in start until end) {
      if (index < spanStart || index >= spanEnd) {
        if (!chars[index].isWhitespace()) {
          return false
        }
      }
    }
    return true
  }
}
