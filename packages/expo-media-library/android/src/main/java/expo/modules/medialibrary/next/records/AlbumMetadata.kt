package expo.modules.medialibrary.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class AlbumMetadata(
  @Field val id: String,
  @Field val title: String,
  // iOS only field
  @Field val type: String? = null
) : Record
