package expo.modules.video

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.ImageButton
import androidx.media3.ui.PlayerView

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class FullscreenPlayerActivity : Activity() {
  private lateinit var mContentView: View
  private lateinit var videoViewId: String
  private lateinit var playerView: PlayerView
  private lateinit var videoView: VideoView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.fullscreen_player_activity)
    mContentView = findViewById(R.id.enclosing_layout)

    playerView = findViewById(R.id.player_view)
    videoViewId = intent.getStringExtra(VideoManager.INTENT_PLAYER_KEY)
      ?: throw FullScreenVideoViewNotFoundException()

    videoView = VideoManager.getVideoView(videoViewId)
    videoView.videoPlayer?.changePlayerView(playerView)
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    hideStatusBar()
    setupFullscreenButton()
    playerView.applyRequiresLinearPlayback(videoView.videoPlayer?.requiresLinearPlayback ?: false)
    playerView.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      // On every re-layout ExoPlayer makes the timeBar interactive.
      // We need to disable it to keep scrubbing off.
      playerView.setTimeBarInteractive(videoView.videoPlayer?.requiresLinearPlayback ?: true)
    }
  }

  override fun finish() {
    super.finish()
    VideoManager.getVideoView(videoViewId).exitFullscreen()

    // Disable the exit transition
    if (Build.VERSION.SDK_INT >= 34) {
      overrideActivityTransition(OVERRIDE_TRANSITION_CLOSE, 0, 0)
    } else {
      overridePendingTransition(0, 0)
    }
  }

  private fun setupFullscreenButton() {
    playerView.setFullscreenButtonClickListener { finish() }

    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit)
  }

  private fun hideStatusBar() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
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
