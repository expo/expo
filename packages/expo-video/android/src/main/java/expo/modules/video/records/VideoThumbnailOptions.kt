package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class VideoThumbnailOptions(
  @Field val maxWidth: Int? = null,
  @Field val maxHeight: Int? = null
) : Record, Serializable
