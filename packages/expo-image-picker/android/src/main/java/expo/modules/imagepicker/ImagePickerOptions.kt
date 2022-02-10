package expo.modules.imagepicker

import android.content.Intent
import androidx.annotation.FloatRange
import androidx.annotation.IntRange
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class ImagePickerOptions: Record {
  /**
   * TODO(@bbarthec): restore preventing numbers from outside valid range
   */
  @Field
  @FloatRange(from = 0.0, to = 1.0, fromInclusive = true, toInclusive = true)
  var quality: Double = 0.2

  @Field
  var allowsEditing: Boolean = false

  /**
   * TODO(@bbarthec): prevent negative numbers
   * TODO(@bbarthec): undocumented
   */
  @Field
  var forceAspect: Pair<Int, Int>? = null

  @Field
  var base64: Boolean = false

  @Field
  var mediaTypes: MediaTypes = MediaTypes.IMAGES

  @Field
  var exif: Boolean = false

  /**
   * TODO(@bbarthec): prevent negative numbers
   */
  @Field
  @IntRange(from = 0)
  var videoMaxDuration: Int = 0
}

enum class MediaTypes(val value: String) {
  IMAGES("Images"),
  VIDEOS("Videos"),
  ALL("All");

  internal fun toIntent(): Intent {
    return Intent().also {
      when (this) {
        IMAGES -> it.type = "image/*"
        VIDEOS -> it.type = "video/*"
        ALL -> {
          it.type = "*/*"
          it.putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "video/*"))
        }
      }

      it.action = Intent.ACTION_GET_CONTENT
    }
  }
}
