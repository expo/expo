package expo.modules.devlauncher.helpers

import android.net.Uri
import expo.modules.devmenu.launch.ExpoLaunchUrl

fun replaceEXPScheme(uri: Uri, scheme: String): Uri = if (uri.scheme == "exp") uri.buildUpon().scheme(scheme).build() else uri

/** A launcher command: any `__expo_*` query param, or the legacy `expo-development-client` host. */
fun isDevLauncherUrl(uri: Uri) = ExpoLaunchUrl(uri).isLauncherCommand

/** Whether the launcher URL names a project to load, through `__expo_url` or the legacy `url`. */
fun hasUrlQueryParam(uri: Uri): Boolean = ExpoLaunchUrl(uri).targetUrl != null

class DevLauncherUrl(url: Uri) {
  val launch = ExpoLaunchUrl(url)

  /** The project URL to load, with `exp` rewritten to `http`. */
  val url: Uri = replaceEXPScheme(launch.targetUrl ?: launch.strippedUrl, "http")

  /** Query params the launcher passes on, for example `updateMessage`. Never contains reserved params. */
  val queryParams: Map<String, String> = launch.passthroughParams
}
