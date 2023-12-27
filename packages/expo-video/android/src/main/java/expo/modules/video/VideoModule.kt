package expo.modules.video

import android.app.Activity
import android.view.View
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.ui.DefaultTimeBar
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoModule : Module() {
  private val activity: Activity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("ExpoVideo")

    View(VideoView::class) {
      Prop("player") { view: VideoView, player: VideoPlayer ->
        view.videoPlayer = player
        player.prepare()
      }

      Prop("nativeControls") { view: VideoView, useNativeControls: Boolean ->
        view.playerView.useController = useNativeControls
      }

      Prop("contentFit") { view: VideoView, contentFit: ContentFit ->
        view.playerView.resizeMode = contentFit.toResizeMode()
      }

      Prop("requiresLinearPlayback") { view: VideoView, requiresLinearPlayback: Boolean? ->
        val linearPlayback = requiresLinearPlayback ?: false
        view.playerView.setShowFastForwardButton(!linearPlayback)
        view.playerView.setShowRewindButton(!linearPlayback)
        view.playerView.setShowPreviousButton(!linearPlayback)
        view.playerView.setShowNextButton(!linearPlayback)

        // TODO: Make the requiresLinearPlayback hide only the scrubber instead of the whole progress bar.
        //  Maybe use custom layout for the player as the scrubber is not available?
        val progressBar = view.playerView.findViewById<View>(androidx.media3.ui.R.id.exo_progress)
        if (progressBar is DefaultTimeBar) {
          progressBar.visibility = if (linearPlayback) {
            View.GONE
          } else {
            View.VISIBLE
          }
        }
        view.videoPlayer?.requiresLinearPlayback = linearPlayback
      }
    }

    Class(VideoPlayer::class) {
      Constructor { source: String ->
        val mediaItem = MediaItem.fromUri(source)
        VideoPlayer(activity.applicationContext, mediaItem)
      }

      Property("isPlaying")
        .get { ref: VideoPlayer ->
          ref.isPlaying
        }

      Property("isLoading")
        .get { ref: VideoPlayer ->
          ref.isLoading
        }

      Property("isMuted")
        .get { ref: VideoPlayer ->
          ref.isMuted
        }
        .set { ref: VideoPlayer, isMuted: Boolean ->
          appContext.mainQueue.launch {
            ref.isMuted = isMuted
          }
        }

      Property("volume")
        .get { ref: VideoPlayer ->
          ref.volume
        }
        .set { ref: VideoPlayer, volume: Float ->
          appContext.mainQueue.launch {
            ref.userVolume = volume
            ref.volume = volume
          }
        }

      Property("currentTime")
        .get { ref: VideoPlayer ->
          // TODO: we shouldn't block the thread, but there are no events for the player position change,
          //  so we can't update the currentTime in a non-blocking way like the other properties.
          //  Until we think of something better we can temporarily do it this way
          runBlocking(appContext.mainQueue.coroutineContext) {
            ref.player.currentPosition
          }
        }

      Function("getPlaybackSpeed") { ref: VideoPlayer ->
        ref.playbackParameters.speed
      }

      Function("setPlaybackSpeed") { ref: VideoPlayer, speed: Float ->
        appContext.mainQueue.launch {
          ref.playbackParameters = PlaybackParameters(speed)
        }
      }

      Function("play") { ref: VideoPlayer ->
        appContext.mainQueue.launch {
          ref.player.play()
        }
      }

      Function("pause") { ref: VideoPlayer ->
        appContext.mainQueue.launch {
          ref.player.pause()
        }
      }

      Function("replace") { ref: VideoPlayer, source: String ->
        appContext.mainQueue.launch {
          val mediaItem = MediaItem.fromUri(source)
          ref.player.setMediaItem(mediaItem)
        }
      }

      Function("seekBy") { ref: VideoPlayer, seekTime: Double ->
        appContext.mainQueue.launch {
          val seekPos = ref.player.currentPosition + (seekTime * 1000).toLong()
          ref.player.seekTo(seekPos)
        }
      }

      Function("replay") { ref: VideoPlayer ->
        appContext.mainQueue.launch {
          ref.player.seekTo(0)
          ref.player.play()
        }
      }
    }
  }
}
