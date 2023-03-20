package expo.modules.blur

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal class BlurModuleOptions(
  @Field var intensity: Float?,
  @Field var tintColor: Int?,
  @Field var blurReductionFactor: Float?
) : Record
