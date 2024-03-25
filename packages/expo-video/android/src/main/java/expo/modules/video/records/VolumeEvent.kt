package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

internal class VolumeEvent(
  @Field var volume: Float? = null,
  @Field var muted: Boolean? = null
) : Record, Serializable
