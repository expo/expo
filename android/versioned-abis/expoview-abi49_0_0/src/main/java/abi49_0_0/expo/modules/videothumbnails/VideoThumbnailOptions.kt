package abi49_0_0.expo.modules.videothumbnails

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record

data class VideoThumbnailOptions(
  @Field
  val quality: Double = 1.0,

  @Field
  val time: Int = 0,

  @Field
  val headers: Map<String, String> = emptyMap()
) : Record

data class VideoThumbnailResult(
  @Field
  val uri: String,

  @Field
  val width: Int?,

  @Field
  val height: Int?
) : Record
