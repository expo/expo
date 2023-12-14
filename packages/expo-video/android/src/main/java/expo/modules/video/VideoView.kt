package expo.modules.video

import android.content.Context
import android.util.DisplayMetrics
import android.view.ViewGroup
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView


class VideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val playerView = PlayerView(context.applicationContext)

  init {
    addView(playerView, ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
    ))
  }

  var player: ExoPlayer? = null
    set(player) {
      playerView.player = player
      field = player
    }

  fun enterFullScreen() {
    // todo: make it work
    val metrics = DisplayMetrics()
    appContext.activityProvider?.currentActivity?.windowManager?.defaultDisplay?.getMetrics(metrics)
    val params = playerView.layoutParams
    params.width = metrics.widthPixels
    params.height = metrics.heightPixels
    playerView.layoutParams = params
  }

  fun setContentFit(contentFit: Any) {
    TODO("Find function to modify the content fit")
  }
}