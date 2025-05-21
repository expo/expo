package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.video.enums.ContentFit
import expo.modules.video.utils.MutableWeakReference
import java.lang.ref.WeakReference
import kotlin.math.abs

/**
 * Workaround around the `onRenderedFirstFrame` and `SurfaceView` layout race condition bug.
 * Ensures that the `onFirstFrame` event is sent after the `SurfaceView` is fully laid out.
 * ExoPlayer sometimes emits `onRenderedFirstFrame` before the `SurfaceView` is laid out.
 * If the frame is rendered before layout it becomes stretched to the size of the parent view.
 * We want our event to be emitted only after we are sure that the frame is being displayed correctly.
 * https://github.com/google/ExoPlayer/issues/5222
 */
@OptIn(UnstableApi::class)
internal class FirstFrameEventGenerator(
  player: ExoPlayer,
  private val currentViewReference: MutableWeakReference<PlayerView?>,
  private val onFirstFrameRendered: () -> Unit
) : Player.Listener {
  val playerReference = WeakReference(player)
  private var hasPendingOnFirstFrame = false
  private var hasSentFirstFrameForCurrentMediaItem = false

  init {
    player.addListener(this)
  }

  override fun onRenderedFirstFrame() {
    if (isPlayerSurfaceLayoutValid()) {
      maybeCallOnFirstFrameRendered()
    } else {
      hasPendingOnFirstFrame = true
    }
  }

  override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
    hasSentFirstFrameForCurrentMediaItem = false
    super.onMediaItemTransition(mediaItem, reason)
  }

  override fun onSurfaceSizeChanged(width: Int, height: Int) {
    if (isPlayerSurfaceLayoutValid() && hasPendingOnFirstFrame) {
      maybeCallOnFirstFrameRendered()
    }
  }

  // Unlike iOS, android calls `onRenderedFirstFrame` multiple times for the same media item (after seeking).
  // We want to match the behavior across platforms, so we limit the number of event emissions.
  private fun maybeCallOnFirstFrameRendered() {
    if (!hasSentFirstFrameForCurrentMediaItem) {
      onFirstFrameRendered()
    }
    hasPendingOnFirstFrame = false
    hasSentFirstFrameForCurrentMediaItem = true
  }

  private fun isPlayerSurfaceLayoutValid(): Boolean {
    // Sometimes the video size announced by the track will is 1px off the render size.
    val epsilon = 0.05
    val player = playerReference.get() ?: run {
      return false
    }
    val currentPlayerView = currentViewReference.get() ?: run {
      return false
    }
    val surfaceWidth = player.surfaceSize.width
    val surfaceHeight = player.surfaceSize.height
    val sourceWidth = player.videoSize.width
    val sourceHeight = player.videoSize.height
    val sourcePixelWidthHeightRatio = player.videoSize.pixelWidthHeightRatio

    if (surfaceWidth == 0 || surfaceHeight == 0) {
      return false
    }

    val surfaceAspectRatio = surfaceWidth.toFloat() / surfaceHeight
    val trackAspectRatio = sourceWidth.toFloat() / sourceHeight * sourcePixelWidthHeightRatio

    val videoSizeIsUnknown = sourceWidth == 0 || sourceHeight == 0
    val hasFillContentFit = currentPlayerView.resizeMode == ContentFit.FILL.toResizeMode()
    val hasCorrectRatio = abs(trackAspectRatio - surfaceAspectRatio) < epsilon

    return (hasCorrectRatio || hasFillContentFit || videoSizeIsUnknown)
  }
}
