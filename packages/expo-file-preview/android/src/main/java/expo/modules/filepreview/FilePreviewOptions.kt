package expo.modules.filepreview

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class FilePreviewOpenOptions(
  @Field val title: String? = null,
  @Field val mimeType: String? = null
) : Record

@OptimizedRecord
data class FilePreviewCanPreviewOptions(
  @Field val mimeType: String? = null
) : Record
