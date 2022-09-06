package expo.modules.imagepicker

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class ImagePickerCancelledResponse : Record {
  @Field
  val cancelled: Boolean = true
}

internal sealed class ImagePickerResponse : Record {
  @Field
  val cancelled: Boolean = false

  sealed class Single(
    @Field val type: MediaType,
    @Field val uri: String,
    @Field val width: Int,
    @Field val height: Int,
    @Field val assetId: String?,
  ) : ImagePickerResponse() {
    class Image(
      uri: String,
      width: Int,
      height: Int,
      assetId: String?,

      @Field val base64: String?,
      @Field val exif: Bundle?
    ) : Single(MediaType.IMAGE, uri, width, height, assetId)

    class Video(
      uri: String,
      width: Int,
      height: Int,
      assetId: String?,

      @Field val duration: Int,
      @Field val rotation: Int
    ) : Single(MediaType.VIDEO, uri, width, height, assetId)
  }

  class Multiple(
    @Field
    val selected: List<Single>
  ) : ImagePickerResponse()
}

enum class MediaType(val value: String) {
  VIDEO("video"),
  IMAGE("image"),
}
