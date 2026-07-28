package expo.modules.video.records

import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.enums.VideoChangeFrameRateStrategy
import java.io.Serializable
import kotlin.time.Duration
import expo.modules.kotlin.types.OptimizedRecord

@UnstableApi
@OptimizedRecord
class PlayerBuilderOptions(
  @Field var seekBackwardIncrement: Duration? = null,
  @Field var seekForwardIncrement: Duration? = null,
  @Field var videoChangeFrameRateStrategy: VideoChangeFrameRateStrategy? = null
) : Record, Serializable
