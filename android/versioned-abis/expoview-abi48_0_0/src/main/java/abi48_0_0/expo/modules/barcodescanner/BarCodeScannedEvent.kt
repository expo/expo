package abi48_0_0.expo.modules.barcodescanner

import android.os.Bundle
import abi48_0_0.expo.modules.kotlin.records.Field
import abi48_0_0.expo.modules.kotlin.records.Record

data class BarCodeScannedEvent(
  @Field val target: Int,
  @Field val data: String,
  @Field val type: Int,
  @Field val cornerPoints: ArrayList<Bundle>,
  @Field val bounds: Bundle
) : Record
