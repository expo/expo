package expo.modules.print

import io.github.expo.modules.v2.Record

@Record
internal data class PrintOptions(
  val html: String? = null,
  val uri: String? = null,
  val width: Int? = null,
  val height: Int? = null,
  val orientation: String? = null,
  val textZoom: Int? = null,
  val base64: Boolean = false
)
