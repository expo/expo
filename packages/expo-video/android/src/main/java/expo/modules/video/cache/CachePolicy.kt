package expo.modules.video.cache

data class CachePolicy(
  val varyHeaders: List<String>,
  val isCacheable: Boolean,
  val allowsAuthorizedReuse: Boolean
) {
  companion object {
    fun evaluate(responseHeaders: Map<String, String>, statusCode: Int): CachePolicy {
      if (statusCode != 200 && statusCode != 206) {
        return CachePolicy(emptyList(), isCacheable = false, allowsAuthorizedReuse = false)
      }

      val vary = splitRespectingQuotes(headerValue(responseHeaders, "vary"))
      val cacheControl = directiveNames(splitRespectingQuotes(headerValue(responseHeaders, "cache-control")))

      if (vary.any { it.trim() == "*" }) {
        return CachePolicy(emptyList(), isCacheable = false, allowsAuthorizedReuse = false)
      }

      val allowsAuth = "public" in cacheControl ||
        "must-revalidate" in cacheControl ||
        "s-maxage" in cacheControl

      val normalizedVary = vary
        .map { it.lowercase() }
        .filter { it != "*" }
        .distinct()
        .sorted()

      return CachePolicy(normalizedVary, isCacheable = true, allowsAuthorizedReuse = allowsAuth)
    }

    private fun headerValue(headers: Map<String, String>, name: String): String {
      val lower = name.lowercase()
      return headers.entries.firstOrNull { it.key.lowercase() == lower }?.value.orEmpty()
    }

    /**
     * Splits a header value on `,` while treating commas inside double-quoted
     * strings as literal. Required for directives like `private="X-Foo, X-Bar"`
     * where a naive split would shred the quoted field-name list.
     */
    private fun splitRespectingQuotes(value: String): List<String> {
      val tokens = mutableListOf<String>()
      val current = StringBuilder()
      var inQuotes = false
      for (c in value) {
        when {
          c == '"' -> {
            inQuotes = !inQuotes
            current.append(c)
          }
          c == ',' && !inQuotes -> {
            val trimmed = current.toString().trim()
            if (trimmed.isNotEmpty()) tokens.add(trimmed)
            current.setLength(0)
          }
          else -> current.append(c)
        }
      }
      val trimmed = current.toString().trim()
      if (trimmed.isNotEmpty()) tokens.add(trimmed)
      return tokens
    }

    /**
     * Extracts the directive name (the part before `=`) from each token. Values
     * are intentionally dropped — the policy decisions above only need presence.
     */
    private fun directiveNames(tokens: List<String>): Set<String> {
      val names = mutableSetOf<String>()
      for (token in tokens) {
        val eq = token.indexOf('=')
        val name = (if (eq >= 0) token.substring(0, eq) else token).trim().lowercase()
        if (name.isNotEmpty()) names.add(name)
      }
      return names
    }
  }
}
