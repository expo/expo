package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class TimeUpdate(
  @Field var currentTime: Double = .0,
  @Field var currentOffsetFromLive: Float? = null,
  @Field var currentLiveTimestamp: Long? = null,
  @Field var bufferedPosition: Double = .0
) : Record, Serializable
