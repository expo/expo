package expo.modules.webbrowser

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal data class OpenBrowserOptions(
  @Field val toolbarColor: Int? = null,
  @Field val secondaryToolbarColor: Int? = null,
  @Field val browserPackage: String? = null,
  @Field val showTitle: Boolean = false,
  @Field val enableDefaultShareMenuItem: Boolean = false,
  @Field val enableBarCollapsing: Boolean = false,
  @Field val showInRecents: Boolean = false,
  @Field(key = "createTask") val shouldCreateTask: Boolean = true,
  @Field val useProxyActivity: Boolean = true
) : Record
