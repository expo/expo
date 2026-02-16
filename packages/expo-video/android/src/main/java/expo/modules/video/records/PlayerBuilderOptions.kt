package expo.modules.video.records

import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable
import kotlin.time.Duration

@UnstableApi
class PlayerBuilderOptions(
  @Field var seekBackwardIncrement: Duration? = null,
  @Field var seekForwardIncrement: Duration? = null
) : Record, Serializable
