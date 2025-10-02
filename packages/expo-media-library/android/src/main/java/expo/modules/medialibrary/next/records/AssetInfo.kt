package expo.modules.medialibrary.next.records

import android.net.Uri
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.medialibrary.next.objects.wrappers.MediaType

data class AssetInfo(
  @Field val id: Uri,
  @Field val creationTime: Long?,
  @Field val duration: Long?,
  @Field val filename: String,
  @Field val height: Int,
  @Field val width: Int,
  @Field val mediaType: MediaType,
  @Field val modificationTime: Long?,
  @Field val uri: Uri
) : Record
