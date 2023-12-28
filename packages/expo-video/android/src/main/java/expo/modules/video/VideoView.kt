package expo.modules.video

import android.content.Context
import android.content.Intent
import android.view.ViewGroup
import android.widget.ImageButton
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.UUID

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val id: String = UUID.randomUUID().toString()
  val playerView = PlayerView(context.applicationContext)
  var videoPlayer: VideoPlayer? = null
    set(videoPlayer) {
      playerView.player = videoPlayer?.player
      field = videoPlayer
    }

  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  init {
    VideoViewManager.addVideoView(this)
    playerView.setFullscreenButtonClickListener { enterFullscreen() }
    addView(
      playerView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
  }

  fun enterFullscreen() {
    val intent = Intent(context, FullscreenActivity::class.java)
    intent.putExtra(VideoViewManager.INTENT_PLAYER_KEY, id)

    appContext.activityProvider?.currentActivity?.startActivity(intent)
  }

  fun exitFullscreen() {
    // Fullscreen uses a different PlayerView instance, because of that we need to manually update the non-fullscreen player icon after exiting
    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_enter)
    videoPlayer?.changePlayerView(playerView)
  }

  override fun requestLayout() {
    super.requestLayout()

    // Code borrowed from:
    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166
    // This fixes some layout issues with the exoplayer which caused the resizeMode to not work properly
    post(mLayoutRunnable)
  }
}
