package expo.modules.barcodescanner

import android.os.Bundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class BarCodeScannedEvent(
  @Field val target: Int,
  @Field val data: String,
  @Field val raw: String,
  @Field val type: Int,
  @Field val cornerPoints: ArrayList<Bundle>,
  @Field val bounds: Bundle
) : Record
