package expo.modules.devmenu.launch

import android.net.Uri

/**
 * Parses the reserved `__expo_*` query params of a launch URL. A URL is a launcher command when it
 * carries any `__expo_*` param or its host is the legacy `expo-development-client`.
 * Keep in sync with `packages/expo-dev-menu/ios/Launch/ExpoLauncherURL.swift`.
 */
class ExpoLauncherUrl(val url: Uri) {
  private val paramNames: Set<String> = if (url.isHierarchical) url.queryParameterNames else emptySet()
  private val hasReservedParams = paramNames.any { it.startsWith(RESERVED_PREFIX) }

  val isLegacyHost = url.host == LEGACY_HOST
  val isLauncherCommand = isLegacyHost || hasReservedParams

  /** From `__expo_url`, or the legacy `url` next to the legacy host. */
  val targetUrl: Uri? = param("url", legacy = "url")?.takeIf { it.isNotEmpty() }?.let(Uri::parse)

  /** `__expo_disable_onboarding=1`, or the legacy `disableOnboarding=1` next to the legacy host. */
  val disablesOnboarding = param("disable_onboarding", legacy = "disableOnboarding") == "1"

  /** `__expo_disable_fab=1`: hide the floating tools button for this process. */
  val disablesFab = param("disable_fab") == "1"

  /** `__expo_disable_auto_launch=1`: do not open the dev menu at launch in this process. */
  val disablesAutoLaunch = param("disable_auto_launch") == "1"

  /** The URL without its `__expo_*` params. */
  val strippedUrl: Uri = if (!hasReservedParams) {
    url
  } else {
    val remaining = url.encodedQuery.orEmpty().split('&')
      .filter { it.isNotEmpty() && !Uri.decode(it.substringBefore('=')).startsWith(RESERVED_PREFIX) }
    url.buildUpon().encodedQuery(remaining.joinToString("&").ifEmpty { null }).build()
  }

  /** The other query params, decoded. */
  val passthroughParams: Map<String, String> = paramNames
    .filterNot { it.startsWith(RESERVED_PREFIX) }
    .associateWith { url.getQueryParameter(it).orEmpty() }

  /** Whether [strippedUrl] still points somewhere an app can route: a host or a path. */
  val remainderHasDestination: Boolean =
    strippedUrl.host.let { !it.isNullOrEmpty() && it != LEGACY_HOST } ||
      strippedUrl.path.let { !it.isNullOrEmpty() && it != "/" }

  /** `__expo_<name>`, or the [legacy] param next to the legacy host. */
  private fun param(name: String, legacy: String? = null): String? {
    if (!url.isHierarchical) return null
    return url.getQueryParameter(RESERVED_PREFIX + name)
      ?: legacy?.takeIf { isLegacyHost }?.let(url::getQueryParameter)
  }

  companion object {
    const val RESERVED_PREFIX = "__expo_"
    const val LEGACY_HOST = "expo-development-client"
  }
}
