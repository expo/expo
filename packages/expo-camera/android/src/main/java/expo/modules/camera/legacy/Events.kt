package expo.modules.camera.legacy

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class FaceDetectionErrorEvent(
  @Field val isOperational: Boolean
) : Record

data class FacesDetectedEvent(
  @Field val type: String,
  @Field val faces: List<Bundle>,
  @Field val target: Int
) : Record
