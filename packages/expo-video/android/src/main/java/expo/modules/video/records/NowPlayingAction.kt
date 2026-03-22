package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class NowPlayingAction(
  @Field var iconName: String,
  @Field var displayName: String,
  @Field var action: String,
  @Field var slots: List<Int>? = null
) : Record, Serializable
