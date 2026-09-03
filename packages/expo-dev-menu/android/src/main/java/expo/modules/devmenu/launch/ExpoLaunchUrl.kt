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
  private val hierarchical = url.isHierarchical
  private val paramNames: Set<String> = if (hierarchical) url.queryParameterNames else emptySet()

  /** `true` when the host is the legacy `expo-development-client` alias. */
  val isLegacyHost: Boolean = url.host == LEGACY_HOST

  /** `true` when the URL carries at least one `__expo_*` query param. */
  val hasReservedParams: Boolean = paramNames.any { it.startsWith(RESERVED_PREFIX) }

  /** `true` when the launcher consumes this URL instead of passing it to the app. */
  val isLauncherCommand: Boolean = isLegacyHost || hasReservedParams

  /** The project URL to load, from `__expo_url` or the legacy `url` param. `null` when absent. */
  val targetUrl: Uri? = (param(URL_PARAM) ?: if (isLegacyHost) param(LEGACY_URL_PARAM) else null)
    ?.takeIf { it.isNotEmpty() }
    ?.let { Uri.parse(it) }

  /** Single-use token minted by Expo Orbit. Never persist or log it. */
  val launchToken: String? = param(LAUNCH_TOKEN_PARAM)?.takeIf { it.isNotEmpty() }

  /** `__expo_disable_onboarding=1`, or the legacy `disableOnboarding=1` on the legacy host. */
  val disablesOnboarding: Boolean = param(DISABLE_ONBOARDING_PARAM) == "1" ||
    (isLegacyHost && param(LEGACY_DISABLE_ONBOARDING_PARAM) == "1")

  /** `__expo_show_menu_at_launch=0`: do not open the dev menu automatically in this process. */
  val suppressesMenuAtLaunch: Boolean = param(SHOW_MENU_AT_LAUNCH_PARAM) == "0"

  /** `__expo_tools_button=0`: hide the floating tools button in this process. */
  val hidesToolsButton: Boolean = param(TOOLS_BUTTON_PARAM) == "0"

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

  private fun param(name: String): String? = if (hierarchical) url.getQueryParameter(name) else null

  private fun stripReservedParams(): Uri {
    val remaining = (url.encodedQuery ?: "")
      .split('&')
      .filter { it.isNotEmpty() && !Uri.decode(it.substringBefore('=')).startsWith(RESERVED_PREFIX) }
    return url.buildUpon().encodedQuery(remaining.joinToString("&").ifEmpty { null }).build()
  }

  companion object {
    const val RESERVED_PREFIX = "__expo_"
    const val LEGACY_HOST = "expo-development-client"
    const val URL_PARAM = "__expo_url"
    const val LAUNCH_TOKEN_PARAM = "__expo_launch_token"
    const val DISABLE_ONBOARDING_PARAM = "__expo_disable_onboarding"
    const val SHOW_MENU_AT_LAUNCH_PARAM = "__expo_show_menu_at_launch"
    const val TOOLS_BUTTON_PARAM = "__expo_tools_button"
    private const val LEGACY_URL_PARAM = "url"
    private const val LEGACY_DISABLE_ONBOARDING_PARAM = "disableOnboarding"
  }
}
