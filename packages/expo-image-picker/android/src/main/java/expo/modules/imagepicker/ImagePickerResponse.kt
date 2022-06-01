package expo.modules.imagepicker

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class ImagePickerCancelledResponse : Record {
  @Field
  val cancelled: Boolean = true
}

internal sealed class ImagePickerMediaResponse(
  @Field val type: MediaType,
  @Field val uri: String,
  @Field val width: Int,
  @Field val height: Int,
) : Record {
  @Field
  val cancelled: Boolean = false

  class Image(
    uri: String,
    width: Int,
    height: Int,

    @Field val base64: String?,
    @Field val exif: Bundle?
  ) : ImagePickerMediaResponse(MediaType.IMAGE, uri, width, height)

  class Video(
    uri: String,
    width: Int,
    height: Int,

    @Field val duration: Int,
    @Field val rotation: Int
  ) : ImagePickerMediaResponse(MediaType.VIDEO, uri, width, height)
}

enum class MediaType(val value: String) {
  VIDEO("video"),
  IMAGE("image"),
}
