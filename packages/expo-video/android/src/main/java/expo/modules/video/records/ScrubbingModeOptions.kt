package expo.modules.video.records

import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ScrubbingModeParameters
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field
import expo.modules.video.player.VideoPlayer
import java.io.Serializable

@UnstableApi
class ScrubbingModeOptions(
  @Field var scrubbingModeEnabled: Boolean = false,
  @Field var increaseCodecOperatingRate: Boolean = true,
  @Field var enableDynamicScheduling: Boolean = true,
  @Field var useDecodeOnlyFlag: Boolean = true,
  @Field var allowSkippingMediaCodecFlush: Boolean = true
) : Record, Serializable {
  fun applyToPlayer(videoPlayer: VideoPlayer) {
    videoPlayer.player.isScrubbingModeEnabled = scrubbingModeEnabled
    videoPlayer.player.scrubbingModeParameters = toScrubbingModeParameters()
  }

  private fun toScrubbingModeParameters(): ScrubbingModeParameters {
    return ScrubbingModeParameters.Builder()
      .setUseDecodeOnlyFlag(useDecodeOnlyFlag)
      .setAllowSkippingMediaCodecFlush(allowSkippingMediaCodecFlush)
      .setShouldIncreaseCodecOperatingRate(increaseCodecOperatingRate)
      .setShouldEnableDynamicScheduling(enableDynamicScheduling)
      .build()
  }
}
