package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class VideoMetadata(
  @Field var title: String? = null,
  @Field var artist: String? = null,
  @Field var artwork: String? = null
) : Record, Serializable
