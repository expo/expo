package expo.modules.devlauncher.helpers

import android.net.Uri
import expo.modules.devmenu.launch.ExpoLauncherUrl

fun replaceEXPScheme(uri: Uri, scheme: String): Uri = if (uri.scheme == "exp") uri.buildUpon().scheme(scheme).build() else uri

class DevLauncherUrl(url: Uri) {
  val launch = ExpoLauncherUrl(url)

  /** The project URL to load, with `exp` rewritten to `http`. */
  val url: Uri = replaceEXPScheme(launch.targetUrl ?: launch.strippedUrl, "http")

  /** Query params the launcher passes on, for example `updateMessage`. Never contains reserved params. */
  val queryParams: Map<String, String> = launch.passthroughParams
}
