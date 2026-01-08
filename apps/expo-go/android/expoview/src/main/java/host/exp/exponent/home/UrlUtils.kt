package host.exp.exponent.home

import android.net.Uri

// A placeholder for what would be Config.api.host
private const val EXPO_HOST = "expo.dev"
private const val SNACK_RUNTIME_URL_PROTOCOL = "exp"
private const val SNACK_RUNTIME_URL_ENDPOINT = "u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824"

val SDK_VERSION = "55.0.0" // TODO: Replace with actual SDK version

fun normalizeSnackUrl(fullName: String, channelName: String? = null): String {
  // In the original code, this uses Environment.supportedSdksString.
  // We'll use the equivalent from your Android project's Constants.

  val builder = Uri.Builder()
    .scheme(SNACK_RUNTIME_URL_PROTOCOL)
    .encodedAuthority(SNACK_RUNTIME_URL_ENDPOINT)
    .appendQueryParameter("runtime-version", "exposdk:$SDK_VERSION")
    .appendQueryParameter("channel-name", "production")
    .appendQueryParameter("snack", fullName)

  // Add the channel parameter only if it's provided
  channelName?.let {
    builder.appendQueryParameter("snack-channel", it)
  }

  return builder.build().toString()
}

/**
 * Rewrites a raw URL string into a normalized Expo URL (exp://).
 * This is a Kotlin translation of the normalizeUrl function from expo-cli.
 *
 * @param rawUrl The user-provided URL string.
 * @return A normalized URL string, defaulting to the exp:// protocol.
 */
fun normalizeUrl(rawUrl: String): String {
  // Trim whitespace and check if the input is empty
  val trimmedUrl = rawUrl.trim()
  if (trimmedUrl.isEmpty()) {
    return trimmedUrl
  }

  // Use Android's Uri parser. It's robust and handles edge cases well.
  val parsedUri = Uri.parse(trimmedUrl)

  // Case 1: Handle shortcuts like "@user/experience"
  // This is identified by a null scheme and a path starting with '@'.
  if (parsedUri.scheme == null && parsedUri.path?.startsWith("@") == true) {
    return "exp://$EXPO_HOST/$trimmedUrl"
  }

  // Case 2: Handle addresses like "192.168.1.10:8081"
  // This is identified by having no scheme.
  if (parsedUri.scheme == null) {
    return "exp://$trimmedUrl"
  }

  // Case 3: The URL already has a scheme (e.g., http://, exp://)
  // Return it as is, letting the system handle it.
  return trimmedUrl
}