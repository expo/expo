package expo.modules.sharing

import io.github.expo.modules.v2.Record

@Record
data class SharingOptions(
  val mimeType: String? = null,
  val UTI: String? = null,
  val dialogTitle: String? = null
)
