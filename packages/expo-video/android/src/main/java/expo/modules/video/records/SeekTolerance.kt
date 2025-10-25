package expo.modules.video.records

import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.exoplayer.SeekParameters
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.player.VideoPlayer
import java.io.Serializable

@UnstableApi
class SeekTolerance(
  @Field var toleranceBefore: Double = 0.0,
  @Field var toleranceAfter: Double = 0.0
) : Record, Serializable {
  fun applyToPlayer(videoPlayer: VideoPlayer) {
    videoPlayer.player.setSeekParameters(toSeekParameters())
  }

  private fun toSeekParameters(): SeekParameters {
    val toleranceBeforeMs = (toleranceBefore * 1000).toLong()
    val toleranceAfterMs = (toleranceAfter * 1000).toLong()
    return SeekParameters(
      Util.msToUs(toleranceBeforeMs),
      Util.msToUs(toleranceAfterMs)
    )
  }
}
