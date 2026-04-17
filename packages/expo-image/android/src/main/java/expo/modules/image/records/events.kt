package expo.modules.image.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class ImageSource(
  @Field val url: String,
  @Field val width: Int,
  @Field val height: Int,
  @Field val mediaType: String?,
  @Field val isAnimated: Boolean
) : Record

@OptimizedRecord
data class ImageLoadEvent(
  @Field val cacheType: String,
  @Field val source: ImageSource
) : Record

@OptimizedRecord
data class ImageProgressEvent(
  @Field val loaded: Int,
  @Field val total: Int
) : Record

@OptimizedRecord
data class ImageErrorEvent(
  @Field val error: String
) : Record
