package expo.modules.video

import android.content.Context
import android.view.ViewGroup
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val playerView = PlayerView(context.applicationContext)

  init {
    addView(
      playerView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
  }

  var videoPlayer: VideoPlayer? = null
    set(videoPlayer) {
      playerView.player = videoPlayer?.player
      field = videoPlayer
    }
}
