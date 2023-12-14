package expo.modules.video

import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObjectId
import kotlinx.coroutines.launch

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoModule : Module() {
  private var volumeBeforeMute = 1f;
  override fun definition() = ModuleDefinition {
    Name("ExpoVideo")

    View(VideoView::class) {
      Prop("player") { view: VideoView, playerId: Int ->
        val player = appContext.sharedObjectRegistry.toNativeObject(SharedObjectId(playerId)) as? VideoPlayer
          ?: return@Prop
        player.prepare()
        view.player = player.player
      }

      AsyncFunction("enterFullscreen") { view: VideoView ->
        view.enterFullScreen()
      }

      Prop("contentFit") {view: VideoView, contentFit: Any ->
        view.setContentFit(contentFit)
      }
    }

    Class(VideoPlayer::class) {
      Constructor { source: String ->
        val mediaItem = MediaItem.fromUri(source)
        val context = appContext.currentActivity!!

        VideoPlayer(context.applicationContext, mediaItem)
      }
      Property("isPlaying") { ref: VideoPlayer ->
        ref.playerListener.isPlaying
      }

      Property("isLoading") { ref: VideoPlayer ->
        ref.playerListener.isLoading
      }

      Property("isMuted") {ref: VideoPlayer ->
        ref.playerListener.isMuted
      }
      .set { ref: VideoPlayer, isMuted: Boolean ->
        appContext.mainQueue.launch {
          if (isMuted) {
            volumeBeforeMute = ref.playerListener.volume
          }

          ref.player.volume = if (isMuted) 0f else volumeBeforeMute
          ref.playerListener.isMuted = isMuted
        }
      }

      Property("volume") { ref: VideoPlayer ->
        ref.playerListener.volume
      }
      .set{ref:VideoPlayer, volume: Float ->
        appContext.mainQueue.launch {
          ref.playerListener.volume = volume
          ref.player.volume = volume
        }
      }

      AsyncFunction("getPlaybackSpeed") { ref: VideoPlayer ->
        appContext.mainQueue.launch {
          ref.player.playbackParameters.speed
        }
      }

      Function("setPlaybackSpeed") { ref: VideoPlayer, speed: Float ->
        appContext.mainQueue.launch {
          ref.player.playbackParameters = PlaybackParameters(speed)
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

      AsyncFunction("getCurrentTime") { ref: VideoPlayer ->
        appContext.mainQueue.launch {
          ref.player.currentPosition
        }
      }

      Function("seekBy") { ref: VideoPlayer, seekTime: Long ->
        appContext.mainQueue.launch {
          val seekPos = ref.player.currentPosition + (seekTime * 1000)
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