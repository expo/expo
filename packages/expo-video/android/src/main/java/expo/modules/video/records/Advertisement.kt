package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Advertisement(
  @Field var googleIMA: GoogleIMA? = null
) : Record, Serializable
