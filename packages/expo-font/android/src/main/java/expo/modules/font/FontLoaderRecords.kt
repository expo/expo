package expo.modules.font

import io.github.expo.modules.v2.Record

@Record
data class FontFaceRecord(
  val localUri: String = "",
  val weight: Int? = null,
  val style: String? = null
)
