package expo.modules.video

import android.app.Activity
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.ImageButton
import androidx.media3.ui.PlayerView

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class FullscreenActivity : Activity() {
  private lateinit var mContentView: View
  private lateinit var videoViewId: String
  private lateinit var playerView: PlayerView
  private lateinit var videoView: VideoView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.fullscreen_activity)
    mContentView = findViewById(R.id.enclosing_layout) ?: run {
      // TODO: throw an exception here
      return
    }

    playerView = findViewById(R.id.player_view)
    videoViewId = intent.getStringExtra(VideoViewManager.INTENT_PLAYER_KEY) ?: run {
      // TODO: throw an exception here
      return
    }
    videoView = VideoViewManager.getVideoView(videoViewId)
    videoView.videoPlayer?.changePlayerView(playerView)
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    hideStatusBar()
    setupFullscreenButton()
    playerView.applyRequiresLinearPlayback(videoView.videoPlayer?.requiresLinearPlayback ?: false)
  }

  override fun finish() {
    super.finish()
    VideoViewManager.getVideoView(videoViewId).exitFullscreen()
  }

  private fun setupFullscreenButton() {
    playerView.setFullscreenButtonClickListener { finish() }

    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit)
  }

  private fun hideStatusBar() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
      val controller = mContentView.windowInsetsController
      controller?.apply {
        systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
      }
    } else {
      @Suppress("DEPRECATION")
      mContentView.systemUiVisibility = (
        View.SYSTEM_UI_FLAG_LOW_PROFILE
          or View.SYSTEM_UI_FLAG_FULLSCREEN
          or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        )
    }
  }
}
