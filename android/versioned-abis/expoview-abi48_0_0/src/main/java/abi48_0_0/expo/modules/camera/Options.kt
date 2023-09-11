package abi48_0_0.expo.modules.camera

import android.media.CamcorderProfile
import abi48_0_0.expo.modules.kotlin.records.Field
import abi48_0_0.expo.modules.kotlin.records.Record

class PictureOptions : Record {
  @Field val quality: Double = 1.0
  @Field val base64: Boolean = false
  @Field val exif: Boolean = false
  @Field val additionalExif: Map<String, Any>? = null
  @Field val skipProcessing: Boolean = false
  @Field val fastMode: Boolean = false
  @Field val id: Int? = null
  @Field val maxDownsampling: Int = 1
}

class RecordingOptions : Record {
  @Field val maxDuration: Int = -1
  @Field val maxFileSize: Int = -1
  @Field val quality: Int = CamcorderProfile.QUALITY_HIGH
  @Field val muteValue: Boolean = false
  @Field val videoBitrate: Int? = null
}
