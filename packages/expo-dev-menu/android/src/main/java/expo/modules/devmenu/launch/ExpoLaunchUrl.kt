package expo.modules.devmenu.launch

import android.net.Uri

/**
 * Parses the reserved `__expo_*` query params of a launch URL.
 *
 * A URL is a launcher command when it carries any `__expo_*` param, or when its host is the
 * legacy alias `expo-development-client`. The development client and Expo Go share this parser.
 * Keep in sync with `packages/expo-dev-menu/ios/Launch/ExpoLaunchURL.swift`.
 */
class ExpoLaunchUrl(val url: Uri) {
  /** The reserved launcher params, keyed by the suffix that follows [RESERVED_PREFIX]. */
  enum class Param(suffix: String) {
    URL("url"),
    LAUNCH_TOKEN("launch_token"),
    DISABLE_ONBOARDING("disable_onboarding"),
    DISABLE_FAB("disable_fab"),
    DISABLE_AUTO_LAUNCH("disable_auto_launch");

    /** The full query param name, e.g. `__expo_launch_token`. */
    val paramName: String = RESERVED_PREFIX + suffix
  }

  private val hierarchical = url.isHierarchical
  private val paramNames: Set<String> = if (hierarchical) url.queryParameterNames else emptySet()

  /** `true` when the host is the legacy `expo-development-client` alias. */
  val isLegacyHost: Boolean = url.host == LEGACY_HOST

  /** `true` when the URL carries at least one `__expo_*` query param. */
  val hasReservedParams: Boolean = paramNames.any { it.startsWith(RESERVED_PREFIX) }

  /** `true` when the launcher consumes this URL instead of passing it to the app. */
  val isLauncherCommand: Boolean = isLegacyHost || hasReservedParams

  /** The project URL to load, from `__expo_url` or the legacy `url` param. `null` when absent. */
  val targetUrl: Uri? = (param(Param.URL) ?: if (isLegacyHost) param(LEGACY_URL_PARAM) else null)
    ?.takeIf { it.isNotEmpty() }
    ?.let { Uri.parse(it) }

  /** Single-use token minted by Expo Orbit. Never persist or log it. */
  val launchToken: String? = param(Param.LAUNCH_TOKEN)?.takeIf { it.isNotEmpty() }

  /** `__expo_disable_onboarding=1`, or the legacy `disableOnboarding=1` on the legacy host. */
  val disablesOnboarding: Boolean = param(Param.DISABLE_ONBOARDING) == "1" ||
    (isLegacyHost && param(LEGACY_DISABLE_ONBOARDING_PARAM) == "1")

  /** `__expo_disable_fab=1`, or the legacy `disableFab=1` on the legacy host: hide the floating tools button. */
  val disablesFab: Boolean = param(Param.DISABLE_FAB) == "1" ||
    (isLegacyHost && param(LEGACY_DISABLE_FAB_PARAM) == "1")

  /** `__expo_disable_auto_launch=1`, or the legacy `disableAutoLaunch=1` on the legacy host: do not open the dev menu at launch. */
  val disablesAutoLaunch: Boolean = param(Param.DISABLE_AUTO_LAUNCH) == "1" ||
    (isLegacyHost && param(LEGACY_DISABLE_AUTO_LAUNCH_PARAM) == "1")

  /** The URL without its `__expo_*` params. The legacy `url=` form is kept as is. */
  val strippedUrl: Uri = if (hasReservedParams) stripReservedParams() else url

  /** Query params that are not reserved, decoded like [Uri.getQueryParameter]. */
  val passthroughParams: Map<String, String> = paramNames
    .filterNot { it.startsWith(RESERVED_PREFIX) }
    .associateWith { url.getQueryParameter(it) ?: "" }

  /** `true` when [strippedUrl] still names a destination an app can route: a host or a path. */
  val remainderHasDestination: Boolean = run {
    val host = strippedUrl.host
    val path = strippedUrl.path
    (!host.isNullOrEmpty() && host != LEGACY_HOST) || (!path.isNullOrEmpty() && path != "/")
  }

  private fun param(param: Param): String? = param(param.paramName)

  private fun param(name: String): String? = if (hierarchical) url.getQueryParameter(name) else null

  private fun stripReservedParams(): Uri {
    val remaining = (url.encodedQuery ?: "")
      .split('&')
      .filter { it.isNotEmpty() && !Uri.decode(it.substringBefore('=')).startsWith(RESERVED_PREFIX) }
    return url.buildUpon().encodedQuery(remaining.joinToString("&").ifEmpty { null }).build()
  }

  companion object {
    /** Reserved query params start with this prefix. */
    const val RESERVED_PREFIX = "__expo_"
    const val LEGACY_HOST = "expo-development-client"
    private const val LEGACY_URL_PARAM = "url"
    private const val LEGACY_DISABLE_ONBOARDING_PARAM = "disableOnboarding"
    private const val LEGACY_DISABLE_FAB_PARAM = "disableFab"
    private const val LEGACY_DISABLE_AUTO_LAUNCH_PARAM = "disableAutoLaunch"
  }
}
