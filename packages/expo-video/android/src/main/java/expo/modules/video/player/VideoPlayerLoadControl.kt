package expo.modules.video.player

import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import expo.modules.video.records.BufferOptions

@UnstableApi
class VideoPlayerLoadControl : DefaultLoadControl() {
  private var targetBufferMs: Long
    get() = maxBufferUs / 1000
    set(value) {
      minBufferUs = Util.msToUs(value)
      maxBufferUs = Util.msToUs(value)
    }

  private var bufferForPlaybackMs: Long
    get() = bufferForPlaybackUs / 1000
    set(value) {
      bufferForPlaybackUs = Util.msToUs(value)
    }

  private var bufferForPlaybackAfterRebufferMs: Long
    get() = bufferForPlaybackAfterRebufferUs / 1000
    set(value) {
      bufferForPlaybackAfterRebufferUs = Util.msToUs(value)
    }

  fun applyBufferOptions(bufferOptions: BufferOptions) {
    targetBufferMs = bufferOptions.preferredForwardBufferDuration?.let { (it * 1000).toLong() }
      ?: DEFAULT_MAX_BUFFER_MS.toLong()

    targetBufferBytesOverwrite = if (bufferOptions.maxBufferBytes == 0L) {
      C.LENGTH_UNSET
    } else {
      bufferOptions.maxBufferBytes.toInt()
    }

    if (targetBufferBytesOverwrite != C.LENGTH_UNSET) {
      for (state in loadingStates.values) {
        state.targetBufferBytes = targetBufferBytesOverwrite
      }
    }

    prioritizeTimeOverSizeThresholds = bufferOptions.prioritizeTimeOverSizeThreshold

    val safeBufferForPlayback = if (bufferOptions.minBufferForPlayback * 1000 > targetBufferMs) {
      targetBufferMs
    } else {
      (bufferOptions.minBufferForPlayback * 1000).toLong()
    }
    bufferForPlaybackMs = safeBufferForPlayback
    bufferForPlaybackAfterRebufferMs = safeBufferForPlayback

    updateAllocator()
  }
}
