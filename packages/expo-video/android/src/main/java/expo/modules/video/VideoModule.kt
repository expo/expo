package expo.modules.video

import androidx.media3.common.MediaItem
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObjectId
import kotlinx.coroutines.launch

class VideoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoVideo")

    View(VideoView::class) {
      Prop("player") { view: VideoView, playerId: Int ->
        val player = appContext.sharedObjectRegistry.toNativeObject(SharedObjectId(playerId)) as? VideoPlayer
          ?: return@Prop
        player.prepare()
        view.player = player.player
      }

//      Prop("nativeControls") {}
//
//      Prop("contentFit") {}
//
//      Prop("contentPosition") {}
    }

    Class(VideoPlayer::class) {
      Constructor { source: String ->
        val mediaItem = MediaItem.fromUri(source)
        val context = appContext.currentActivity!!

        VideoPlayer(context.applicationContext, mediaItem)
      }

      Property("isPlaying") {} // TODO: Property requires some fixes @LukMcCall

      Property("isMuted") {}

      Property("currentTime") {}

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

      Function("replace") {}

      Function("seekBy") {}

      Function("replay") {}
    }
  }
}
