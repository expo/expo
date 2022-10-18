package expo.modules.imagepicker

import java.io.Serializable
import android.net.Uri
import android.provider.MediaStore
import androidx.annotation.FloatRange
import androidx.annotation.IntRange
import expo.modules.imagepicker.contracts.CameraContractOptions
import expo.modules.imagepicker.contracts.ImageLibraryContractOptions
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

internal class ImagePickerOptions : Record, Serializable {
  @Field
  var allowsEditing: Boolean = false

  @Field
  var allowsMultipleSelection: Boolean = false

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

  fun toCameraContractOptions(uri: Uri) = CameraContractOptions(uri, this)

  fun toImageLibraryContractOptions() = ImageLibraryContractOptions(this)
}

internal enum class MediaTypes(val value: String) : Enumerable {
  IMAGES("Images"),
  VIDEOS("Videos"),
  ALL("All");

  fun toMimeType(): String {
    return when (this) {
      IMAGES -> ImageAllMimeType
      VIDEOS -> VideoAllMimeType
      ALL -> AllMimeType
    }
  }

  fun toFileExtension(): String {
    return when (this) {
      VIDEOS -> ".mp4"
      else -> ".jpeg"
    }
  }

  /**
   * Return [MediaStore]'s intent capture action associated with given media types
   */
  fun toCameraIntentAction(): String {
    return when (this) {
      VIDEOS -> MediaStore.ACTION_VIDEO_CAPTURE
      else -> MediaStore.ACTION_IMAGE_CAPTURE
    }
  }

  private companion object {
    const val ImageAllMimeType = "image/*"
    const val VideoAllMimeType = "video/*"
    const val AllMimeType = "*/*"
  }
}
