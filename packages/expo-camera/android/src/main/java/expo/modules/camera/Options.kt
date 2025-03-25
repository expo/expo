package expo.modules.camera

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

data class PictureOptions(
  @Field val quality: Double = 1.0,
  @Field val base64: Boolean = false,
  @Field val exif: Boolean = false,
  @Field val additionalExif: Map<String, Any>? = null,
  @Field val mirror: Boolean = false,
  @Field val skipProcessing: Boolean = false,
  @Field val imageType: PictureFormat = PictureFormat.JPEG,
  @Field val fastMode: Boolean = false,
  @Field val id: Int? = null,
  @Field val maxDownsampling: Int = 1,
  @Field val shutterSound: Boolean = true,
  @Field val pictureRef: Boolean = false
) : Record

data class SavePictureOptions(
  @Field val quality: Double = 1.0,
  @Field val base64: Boolean = false,
  @Field val metadata: Map<String, Any>? = emptyMap()
) : Record

data class RecordingOptions(
  @Field val maxDuration: Int = 0,
  @Field val maxFileSize: Int = 0
) : Record

enum class PictureFormat(val value: String) : Enumerable {
  JPEG("jpg"),
  PNG("png");

  fun toExtension() = ".${this.value}"
}
