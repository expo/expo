package expo.modules.imagepicker

import java.io.Serializable
import android.provider.MediaStore
import androidx.annotation.FloatRange
import androidx.annotation.IntRange
import expo.modules.imagepicker.contracts.CameraContractOptions
import expo.modules.imagepicker.contracts.ImageLibraryContractOptions
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

internal const val UNLIMITED_SELECTION: Int = 0

internal class ImagePickerOptions : Record, Serializable {
  @Field
  var allowsEditing: Boolean = false

  @Field
  var allowsMultipleSelection: Boolean = false

  @Field
  @FloatRange(from = 0.0, to = 1.0)
  var quality: Double = 1.0

  @Field
  @IntRange(from = 0)
  var selectionLimit: Int = UNLIMITED_SELECTION

  @Field
  var base64: Boolean = false

  @Field
  var exif: Boolean = false

  @Field
  var mediaTypes: Array<JSMediaTypes> = arrayOf(JSMediaTypes.IMAGES)

  @IntRange(from = 0)
  var videoMaxDuration: Int = 0

  @Field
  var aspect: Pair<Int, Int>? = null

  @Field
  var cameraType: CameraType = CameraType.BACK

  @Field
  val legacy: Boolean = false

  val nativeMediaTypes: MediaTypes
    get() = MediaTypes.fromJSMediaTypesArray(mediaTypes)

  fun toCameraContractOptions(uri: String) = CameraContractOptions(uri, this)

  fun toImageLibraryContractOptions() = ImageLibraryContractOptions(this)
}

/**
 * Used to keep compatibility with js media types
 */
internal enum class JSMediaTypes(val value: String) : Enumerable {
  IMAGES("images"),
  VIDEOS("videos"),
  LIVE_PHOTOS("livePhotos")
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

  companion object {
    private const val ImageAllMimeType = "image/*"
    private const val VideoAllMimeType = "video/*"
    private const val AllMimeType = "*/*"

    fun fromJSMediaTypesArray(mediaTypes: Array<JSMediaTypes>): MediaTypes {
      return if (!mediaTypes.contains(JSMediaTypes.VIDEOS)) {
        IMAGES
      } else if (mediaTypes.contains(JSMediaTypes.VIDEOS) && !mediaTypes.contains(JSMediaTypes.IMAGES)) {
        VIDEOS
      } else {
        ALL
      }
    }
  }
}

internal enum class CameraType(val value: String) : Enumerable {
  BACK("back"),
  FRONT("front")
}
