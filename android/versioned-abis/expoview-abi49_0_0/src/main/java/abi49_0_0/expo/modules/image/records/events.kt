package abi49_0_0.expo.modules.image.records

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record

data class ImageSource(
  @Field val url: String,
  @Field val width: Int,
  @Field val height: Int,
  @Field val mediaType: String?
) : Record

data class ImageLoadEvent(
  @Field val cacheType: String,
  @Field val source: ImageSource
) : Record

data class ImageProgressEvent(
  @Field val loaded: Int,
  @Field val total: Int
) : Record

data class ImageErrorEvent(
  @Field val error: String
) : Record
