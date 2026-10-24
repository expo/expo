// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

object ErrorScreenLogMessage {
  fun make(header: String?, userMessage: String?, developerMessage: String?): String? {
    val detail = userMessage?.takeIf { it.isNotEmpty() }
      ?: developerMessage?.takeIf { it.isNotEmpty() }
      ?: return null
    return listOfNotNull(header?.takeIf { it.isNotEmpty() }, toPlainText(detail))
      .joinToString("\n\n")
  }

  // Manifest errors use HTML: <br>, <b>, <h5> and <a href='...'>.
  internal fun toPlainText(html: String): String {
    return html
      .replace(linkPattern) { "${it.groupValues[2]} (${it.groupValues[1]})" }
      .replace(lineBreakPattern, "\n")
      .replace(tagPattern, "")
  }

  private val linkPattern = Regex("""<a\s[^>]*href=['"]([^'"]*)['"][^>]*>(.*?)</a>""", RegexOption.IGNORE_CASE)
  private val lineBreakPattern = Regex("""<br\s*/?>|</h\d>""", RegexOption.IGNORE_CASE)
  private val tagPattern = Regex("""<[^>]+>""")
}
