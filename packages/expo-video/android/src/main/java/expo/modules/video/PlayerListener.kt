package expo.modules.video

import androidx.media3.common.Player
import androidx.media3.common.Timeline

class PlayerListener : Player.Listener {
  var isPlaying = false
    private set(value) {
      field = value
    }

  var isLoading = true
  var isMuted = false
  var volume = 0

  lateinit var timeline: Timeline

  override fun onIsPlayingChanged(isPlaying: Boolean) {
    this.isPlaying = isPlaying
  }

  override fun onTimelineChanged(timeline: Timeline, reason: Int) {
    this.timeline = timeline
  }

  override fun onIsLoadingChanged(isLoading: Boolean) {
    this.isLoading = isLoading
  }

  override fun onDeviceVolumeChanged(volume: Int, muted: Boolean) {
    isMuted = muted
    this.volume = volume
  }

}