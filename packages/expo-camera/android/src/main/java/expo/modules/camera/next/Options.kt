package expo.modules.camera.next

import expo.modules.camera.next.records.VideoQuality
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class PictureOptions(
  @Field val quality: Double = 1.0,
  @Field val base64: Boolean = false,
  @Field val exif: Boolean = false,
  @Field val additionalExif: Map<String, Any>? = null,
  @Field val skipProcessing: Boolean = false,
  @Field val fastMode: Boolean = false,
  @Field val id: Int? = null,
  @Field val maxDownsampling: Int = 1
) : Record

data class RecordingOptions(
  @Field val maxDuration: Int = 0,
  @Field val maxFileSize: Int = 0,
  @Field val quality: VideoQuality?
) : Record
