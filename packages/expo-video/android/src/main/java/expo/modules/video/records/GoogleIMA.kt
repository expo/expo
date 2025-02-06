package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class GoogleIMA(
  @Field var adTagUri: String? = null,
  @Field var id: String? = null,
) : Record, Serializable