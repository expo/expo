package expo.modules.plugin

internal data class PermissionInfo(
  val maxSdkSources: MutableSet<String> = mutableSetOf(),
  val manifestPaths: MutableSet<String> = mutableSetOf()
)
