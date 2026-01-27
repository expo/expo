package expo.modules.imagepicker

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

internal class ImagePickerAsset(
  @Field val assetId: String? = null,
  @Field val type: MediaType? = MediaType.IMAGE,
  @Field val uri: String = "",
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val fileName: String? = null,
  @Field val fileSize: Long? = null,
  @Field val mimeType: String? = null,
  @Field val base64: String? = null,
  @Field val exif: Bundle? = null,
  @Field val duration: Int? = null,
  @Field val rotation: Int? = null
) : Record

internal class ImagePickerResponse(
  @Field val canceled: Boolean = false,
  @Field val assets: List<ImagePickerAsset>? = null
) : Record

enum class MediaType(val value: String) : Enumerable {
  VIDEO("video"),
  IMAGE("image")
}
