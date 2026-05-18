package expo.modules.video.cache

/**
 * Result of evaluating an HTTP response against RFC 9111 caching semantics.
 * Mirrors `CachePolicy.swift` on iOS so both platforms reach the same decision
 * for a given response.
 */
data class CachePolicy(
  val varyHeaders: List<String>,
  val isCacheable: Boolean,
  val allowsAuthorizedReuse: Boolean
) {
  companion object {
    fun evaluate(responseHeaders: Map<String, String>, statusCode: Int): CachePolicy {
      // Only the success codes a video player can play back are worth caching.
      // Caching a 401/500 would lock the user into a stale error.
      if (statusCode != 200 && statusCode != 206) {
        return CachePolicy(emptyList(), isCacheable = false, allowsAuthorizedReuse = false)
      }

      val vary = splitRespectingQuotes(headerValue(responseHeaders, "vary"))
      val cacheControl = directiveNames(splitRespectingQuotes(headerValue(responseHeaders, "cache-control")))

      // `private` excludes shared caches (RFC 9111 §5.2.2.7). Our cache straddles
      // multiple identities on one device, so we treat ourselves as shared.
      if (vary.contains("*") || "no-store" in cacheControl || "private" in cacheControl) {
        return CachePolicy(emptyList(), isCacheable = false, allowsAuthorizedReuse = false)
      }

      // Cache-Control is consulted only for the §3.5 reuse decision below.
      // Freshness directives (`max-age`, `Expires`, `Age`) and conditional
      // revalidation (`If-None-Match`/`Last-Modified`) are not implemented;
      // cached responses live until LRU eviction.
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
