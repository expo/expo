package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class VideoThumbnailOptions(
  @Field val maxWidth: Int? = null,
  @Field val maxHeight: Int? = null
) : Record {
  // Returns a pair of Int values representing a valid size limitation for the thumbnail
  // or null is no limit has been set
  fun toNativeSizeLimit(): Pair<Int, Int>? {
    if (this.maxWidth == null && this.maxHeight == null) {
      return null
    }
    val width = this.maxWidth ?: Int.MAX_VALUE
    val height = this.maxHeight ?: Int.MAX_VALUE

    require(width >= 1 && height >= 1) {
      "Failed to generate a thumbnail: The maxWidth and maxHeight parameters must be greater than zero"
    }
    return width to height
  }
}
