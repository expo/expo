package expo.modules.camera.common

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class BarcodeScannedEvent(
  @Field val target: Int,
  @Field val data: String,
  @Field val raw: String,
  @Field val type: String,
  @Field val cornerPoints: ArrayList<Bundle>,
  @Field val bounds: Bundle,
  @Field val extra: Bundle?
) : Record

@OptimizedRecord
class CameraMountErrorEvent(
  @Field val message: String
) : Record

@OptimizedRecord
class PictureSavedEvent(
  @Field val id: Int,
  @Field val data: Bundle
) : Record
