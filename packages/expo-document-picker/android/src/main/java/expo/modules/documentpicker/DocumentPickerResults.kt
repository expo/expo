package expo.modules.documentpicker

import io.github.expo.modules.v2.Record

@Record
data class DocumentPickerResult(
  val canceled: Boolean = false,
  val assets: List<DocumentInfo>? = null
)

@Record
data class DocumentInfo(
  val uri: String,
  val name: String,
  val mimeType: String?,
  val size: Long?,
  val lastModified: Long
)
