package expo.modules.image.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Source(
  @Field val url: String,
  @Field val width: Int,
  @Field val height: Int,
  @Field val mediaType: String?
): Record

data class ImageLoadEvent(
  @Field val cacheType: Int,
  @Field val source: Source
): Record

data class ImageProgressEvent(
  @Field val loaded: Int,
  @Field val total: Int
): Record

data class ImageErrorEvent(
  @Field val error: String
): Record
