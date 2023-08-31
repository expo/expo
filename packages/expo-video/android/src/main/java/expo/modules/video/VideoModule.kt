package expo.modules.video

import androidx.media3.common.MediaItem
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VideoModule: Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoVideo")

    Class(VideoPlayerRef::class) {
      Constructor{source: String ->
        val mediaItem = MediaItem.fromUri(source)
        val context = appContext.reactContext!!


        VideoPlayerRef(context, mediaItem)
      }

      Property("isPlaying") {} // TODO: Property requires some fixes @LukMcCall

      Property("isMuted") {}

      Property("currentTime") {}

      Function("play") {ref: VideoPlayerRef ->
        ref.player.play()
      }

      Function("pause") {}

      Function("replace") {}

      Function("seekBy") {}

      Function("replay") {}
    }

  }
}