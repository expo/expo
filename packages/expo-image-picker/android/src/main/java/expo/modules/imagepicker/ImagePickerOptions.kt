package expo.modules.imagepicker

import androidx.annotation.FloatRange
import androidx.annotation.IntRange
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class ImagePickerOptions : Record {
  @Field
  var allowsEditing: Boolean = false

  @Field
  @FloatRange(from = 0.0, to = 1.0)
  var quality: Double = 0.2

  @Field
  var base64: Boolean = false

  @Field
  var exif: Boolean = false

  @Field
  var mediaTypes: MediaTypes = MediaTypes.IMAGES

  @IntRange(from = 0)
  var videoMaxDuration: Int = 0

  @Field
  var aspect: Pair<Int, Int>? = null
}

enum class MediaTypes(val value: String) {
  IMAGES("Images"),
  VIDEOS("Videos"),
  ALL("All");
}
