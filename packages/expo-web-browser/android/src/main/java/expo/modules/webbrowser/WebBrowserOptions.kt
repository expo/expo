package expo.modules.webbrowser

import io.github.expo.modules.v2.Record

@Record
data class OpenBrowserOptions(
  val toolbarColor: Int? = null,
  val secondaryToolbarColor: Int? = null,
  val browserPackage: String? = null,
  val showTitle: Boolean = false,
  val enableDefaultShareMenuItem: Boolean = false,
  val enableBarCollapsing: Boolean = false,
  val showInRecents: Boolean = false,
  val createTask: Boolean = true,
  val useProxyActivity: Boolean = true
)

@Record
data class OpenBrowserResult(
  val type: String
)

@Record
data class CustomTabsBrowsersResult(
  val browserPackages: List<String>,
  val servicePackages: List<String>,
  val preferredBrowserPackage: String?,
  val defaultBrowserPackage: String?
)
