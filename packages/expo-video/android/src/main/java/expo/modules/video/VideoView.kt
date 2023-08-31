package expo.modules.video

import android.content.Context
import android.view.ViewGroup
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class VideoView(context: Context, appContext: AppContext): ExpoView(context, appContext) {
  private val playerView = PlayerView(context.applicationContext)

  var player: ExoPlayer? = null
    set(player) {
      playerView.player = player
      field = player
    }

  init {

    addView(playerView, ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
    ))
  }
}