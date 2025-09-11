package expo.modules.video.records

import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.player.DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS
import expo.modules.video.player.DefaultLoadControl.DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS
import java.io.Serializable

@UnstableApi
class BufferOptions(
  @Field var preferredForwardBufferDuration: Double? = null,
  @Field var maxBufferBytes: Long = 0,
  @Field var prioritizeTimeOverSizeThreshold: Boolean = DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS,
  @Field var minBufferForPlayback: Double = DEFAULT_BUFFER_FOR_PLAYBACK_MS.toDouble() / 1000
) : Record, Serializable
