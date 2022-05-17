package expo.modules.imagepicker

import android.net.Uri
import android.provider.MediaStore
import androidx.annotation.FloatRange
import androidx.annotation.IntRange
import expo.modules.imagepicker.crop.CameraContract
import expo.modules.imagepicker.crop.ImageLibraryContract
import expo.modules.kotlin.assertions.assertValueGreaterOrEqual
import expo.modules.kotlin.assertions.assertValueInRange
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class ImagePickerOptions: Record {
  @Field
  var allowsEditing: Boolean = false

  @Field
  var allowsMultipleSelection: Boolean = false

  @Field
  @FloatRange(from = 0.0, to = 1.0)
  var quality: Double = 0.2
    set(value) {
      // TODO(@bbarthec): possibly we don't need that
      assertValueInRange(value, lowerBound = 0.0, upperBound = 1.0)
      field = value
    }

  @Field
  var base64: Boolean = false

  @Field
  var exif: Boolean = false

  @Field
  var mediaTypes: MediaTypes = MediaTypes.IMAGES

  @Field
  @IntRange(from = 0)
  var videoMaxDuration: Int = 0
    set(value) {
      assertValueGreaterOrEqual(value, 0)
      field = value
    }

  @Field
  var aspect: Pair<Int, Int>? = null
    set(value) {
      // TODO(@bbarthec): check if that works
      if (value != null) {
        val (first, second) = value
        assertValueGreaterOrEqual(first, 0)
        assertValueGreaterOrEqual(second, 0)
      }
      field = value
    }

  /**
   * @param uri Target [Uri] that the captured media will be saved into.
   */
  internal fun toCameraContract(uri: Uri) = CameraContract(
    uri,
    mediaTypes.toMimeType(),
  )

  fun toImageLibraryContract() = ImageLibraryContract(
    allowsMultipleSelection,
    mediaTypes.toMimeType(),
    mediaTypes.toMultipleMimeTypes()
  )
}

enum class MediaTypes(val value: String) {
  IMAGES("Images"),
  VIDEOS("Videos"),
  ALL("All");

  internal fun toMimeType(): String {
    return when (this) {
      IMAGES -> ImageAllMimeType
      VIDEOS -> VideoAllMimeType
      ALL -> AllMimeType
    }
  }

  internal fun toMultipleMimeTypes(): Array<String>? {
    return when (this) {
      ALL -> arrayOf(
        ImageAllMimeType,
        VideoAllMimeType
      )
      else -> null
    }
  }

  internal fun toFileExtension(): String {
    return when(this) {
      VIDEOS -> ".mp4"
      else -> ".jpeg"
    }
  }

  /**
   * Return [MediaStore]'s intent capture action associated with given media types
   */
  internal fun toCameraIntentAction(): String {
    return when (this) {
      VIDEOS -> MediaStore.ACTION_VIDEO_CAPTURE
      else -> MediaStore.ACTION_IMAGE_CAPTURE
    }
  }

  internal companion object {
    const val ImageAllMimeType = "image/*"
    const val VideoAllMimeType = "video/*"
    const val AllMimeType = "*/*"
  }
}
