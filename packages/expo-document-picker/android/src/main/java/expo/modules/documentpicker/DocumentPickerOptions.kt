package expo.modules.documentpicker

import io.github.expo.modules.v2.Record

@Record
data class DocumentPickerOptions(
  val copyToCacheDirectory: Boolean,
  val type: List<String>,
  val multiple: Boolean
)
