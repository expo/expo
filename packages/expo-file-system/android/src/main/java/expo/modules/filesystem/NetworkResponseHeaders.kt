package expo.modules.filesystem

import okhttp3.Headers

internal fun Headers.toResponseHeaders(): Map<String, String> =
  toMultimap().mapValues { it.value.firstOrNull() ?: "" }
