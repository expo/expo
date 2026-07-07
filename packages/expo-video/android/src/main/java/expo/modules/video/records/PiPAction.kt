package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class PiPAction(
  @Field var iconName: String,
  @Field var title: String,
  @Field var description: String,
  @Field var action: String
) : Record, Serializable
