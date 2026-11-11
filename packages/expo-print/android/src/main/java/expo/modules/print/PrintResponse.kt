package expo.modules.print

import io.github.expo.modules.v2.Record

@Record
internal data class FilePrintResult(
  val uri: String,
  val numberOfPages: Int,
  val base64: String? = null
)
