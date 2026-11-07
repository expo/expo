package expo.modules.devlauncher.compose.utils

/** Case-insensitive subsequence match: is [query] a subsequence of [text]? */
fun fuzzyMatch(query: String, text: String): Boolean {
  var i = 0
  for (character in text) {
    if (i < query.length && character.equals(query[i], ignoreCase = true)) {
      i++
    }
  }
  return i == query.length
}
