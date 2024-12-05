package expo.modules.video.records

import androidx.media3.common.Format
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class VideoSize(
  @Field var width: Int = 0,
  @Field var height: Int = 0
) : Record, Serializable {
  constructor(size: androidx.media3.common.VideoSize) : this() {
    width = size.width
    height = size.height
  }
  constructor(format: Format) : this() {
    width = format.width
    height = format.height
  }

  // Override equals to make sure that works with IgnoreSameSet correctly
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    (other as? VideoSize)?.let {
      return width == it.width && height == it.height
    }
    return false
  }
}
