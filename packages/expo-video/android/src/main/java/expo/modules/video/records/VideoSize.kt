package expo.modules.video.records

import androidx.media3.common.Format
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class VideoSize(
  @Field val width: Int = 0,
  @Field val height: Int = 0
) : Record, Serializable {
  constructor(size: androidx.media3.common.VideoSize) : this(size.width, size.height)
  constructor(format: Format) : this(format.width, format.height)
}
