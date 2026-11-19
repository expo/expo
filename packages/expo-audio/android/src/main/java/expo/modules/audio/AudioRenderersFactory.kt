package expo.modules.audio

import android.content.Context
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.audio.AudioSink
import androidx.media3.exoplayer.audio.ForwardingAudioSink

@UnstableApi
class AudioRenderersFactory(context: Context) : DefaultRenderersFactory(context) {
  override fun buildAudioSink(
    context: Context,
    enableFloatOutput: Boolean,
    enableAudioOutputPlaybackParams: Boolean
  ): AudioSink? {
    return super.buildAudioSink(context, enableFloatOutput, enableAudioOutputPlaybackParams)
      ?.let { DeferredEndOfStreamAudioSink(it) }
  }
}

// Media3 stops the AudioTrack when a clip fully buffers while paused, and a stopped track never
// starts again, so the first play is silent. The renderer retries end of stream on every render.
@UnstableApi
private class DeferredEndOfStreamAudioSink(sink: AudioSink) : ForwardingAudioSink(sink) {
  private var playing = false

  override fun play() {
    playing = true
    super.play()
  }

  override fun pause() {
    playing = false
    super.pause()
  }

  override fun reset() {
    playing = false
    super.reset()
  }

  override fun playToEndOfStream() {
    if (playing) {
      super.playToEndOfStream()
    }
  }
}
