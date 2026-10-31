package expo.modules.intentlauncher

import io.github.expo.modules.v2.Record

@Record
data class IntentLauncherParams(
  val type: String? = null,
  val category: String? = null,
  val extra: Map<String, Any>? = null,
  val data: String? = null,
  val flags: Int? = null,
  val packageName: String? = null,
  val className: String? = null
)
