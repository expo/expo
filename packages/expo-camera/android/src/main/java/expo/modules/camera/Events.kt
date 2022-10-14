package expo.modules.camera

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class BarCodeScannedEvent(
  @Field val target: Int,
  @Field val data: String,
  @Field val type: Int,
  @Field val cornerPoints: ArrayList<Bundle>,
  @Field val boundingBox: Bundle
) : Record

data class CameraMountErrorEvent(
  @Field val message: String
) : Record

data class FaceDetectionErrorEvent(
  @Field val isOperational: Boolean
) : Record

data class FacesDetectedEvent(
  @Field val type: String,
  @Field val faces: List<Bundle>,
  @Field val target: Int
) : Record

data class PictureSavedEvent(
  @Field val id: Int,
  @Field val data: Bundle
) : Record
