package expo.modules.video

import android.app.Activity
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.content.Context
import android.util.Log
import android.view.View
import android.view.accessibility.CaptioningManager
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.ImageButton
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.exception.CodedException
import expo.modules.video.player.VideoPlayer
import expo.modules.video.records.FullscreenOptions
import expo.modules.video.utils.FullscreenActivityOrientationHelper
import expo.modules.video.utils.SubtitleUtils
import expo.modules.video.utils.applyPiPParams
import expo.modules.video.utils.applyRectHint
import expo.modules.video.utils.calculatePiPAspectRatio
import expo.modules.video.utils.calculateRectHint
import expo.modules.video.managers.VideoManager

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class FullscreenPlayerActivity : Activity() {
  private lateinit var mContentView: View
  private lateinit var videoViewId: String
  private var videoPlayer: VideoPlayer? = null
  private lateinit var playerView: PlayerView
  private lateinit var videoView: VideoView
  private var didFinish = false
  private var wasAutoPaused = false
  private lateinit var options: FullscreenOptions
  private lateinit var orientationHelper: FullscreenActivityOrientationHelper
  private var captioningChangeListener: CaptioningManager.CaptioningChangeListener? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    try {
      videoViewId = intent.getStringExtra(VideoManager.INTENT_PLAYER_KEY)
        ?: throw FullScreenVideoViewNotFoundException()

      options = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getSerializableExtra(INTENT_FULLSCREEN_OPTIONS_KEY, FullscreenOptions::class.java)
          ?: throw FullScreenOptionsNotFoundException()
      } else {
        @Suppress("DEPRECATION")
        intent.getSerializableExtra(INTENT_FULLSCREEN_OPTIONS_KEY) as? FullscreenOptions
          ?: throw FullScreenOptionsNotFoundException()
      }

      videoView = VideoManager.getVideoView(videoViewId)

      orientationHelper = FullscreenActivityOrientationHelper(
        this,
        options,
        onShouldAutoExit = {
          finish()
        },
        onShouldReleaseOrientation = {
          requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
      )
      orientationHelper.startOrientationEventListener()
    } catch (e: CodedException) {
      Log.e("ExpoVideo", "${e.message}", e)
      finish()
      return
    }

    setContentView(R.layout.fullscreen_player_activity)
    mContentView = findViewById(R.id.enclosing_layout)
    playerView = findViewById(R.id.player_view)
    requestedOrientation = options.orientation.toActivityOrientation()

    videoPlayer = videoView.videoPlayer
    videoPlayer?.player?.let {
      PlayerView.switchTargetView(it, videoView.playerView, playerView)
      videoPlayer?.hasBeenDisconnectedFromVideoView() // The video player is disconnected. We are only using the ExoPlayer it contained
    }

    VideoManager.registerFullscreenPlayerActivity(hashCode().toString(), this)
    playerView.player?.let {
      val aspectRatio = calculatePiPAspectRatio(it.videoSize, playerView.width, playerView.height, videoView.contentFit)
      applyPiPParams(this, videoView.autoEnterPiP, aspectRatio)
    }
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    hideStatusBar()
    setupFullscreenButton()
    playerView.applyRequiresLinearPlayback(videoPlayer?.requiresLinearPlayback ?: false)
    playerView.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      // On every re-layout ExoPlayer makes the timeBar interactive.
      // We need to disable it to keep scrubbing off.
      playerView.setTimeBarInteractive(videoPlayer?.requiresLinearPlayback ?: true)
    }
    playerView.setShowSubtitleButton(videoView.showsSubtitlesButton)

    // Configure subtitle view to fix sizing issues with embedded styles (same as VideoView)
    SubtitleUtils.configureSubtitleView(playerView, this)

    // Set up listener for accessibility caption changes
    setupCaptioningChangeListener()

    playerView.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      applyRectHint(this, calculateRectHint(playerView))
    }
  }

  override fun finish() {
    super.finish()
    didFinish = true
    VideoManager.getVideoView(videoViewId).attachPlayer()

    // Disable the exit transition
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      overrideActivityTransition(OVERRIDE_TRANSITION_CLOSE, 0, 0)
    } else {
      @Suppress("DEPRECATION")
      overridePendingTransition(0, 0)
    }
  }

  override fun onResume() {
    orientationHelper.startOrientationEventListener()
    playerView.useController = true
    // Reconfigure subtitles when resuming (handles returning from settings)
    SubtitleUtils.configureSubtitleView(playerView, this)
    super.onResume()
  }

  override fun onPause() {
    if (videoPlayer?.staysActiveInBackground != true && !didFinish) {
      wasAutoPaused = videoPlayer?.player?.isPlaying == true
      if (wasAutoPaused) {
        playerView.useController = false
        videoPlayer?.player?.pause()
      }
    }
    orientationHelper.stopOrientationEventListener()
    super.onPause()
  }

  override fun onDestroy() {
    super.onDestroy()

    // Clean up captioning change listener
    captioningChangeListener?.let {
      val captioningManager = getSystemService(Context.CAPTIONING_SERVICE) as? CaptioningManager
      captioningManager?.removeCaptioningChangeListener(it)
      captioningChangeListener = null
    }

    videoView.exitFullscreen()
    VideoManager.unregisterFullscreenPlayerActivity(hashCode().toString())
    orientationHelper.stopOrientationEventListener()
  }

  private fun setupFullscreenButton() {
    playerView.setFullscreenButtonClickListener { finish() }

    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_exit)
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration?) {
    if (!isInPictureInPictureMode) {
      playerView.useController = videoView.useNativeControls
    } else {
      playerView.useController = false
    }
    if (wasAutoPaused && isInPictureInPictureMode) {
      videoPlayer?.player?.play()
    }
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
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

  private fun setupCaptioningChangeListener() {
    val captioningManager = getSystemService(Context.CAPTIONING_SERVICE) as? CaptioningManager

    captioningChangeListener = SubtitleUtils.createCaptioningChangeListener(playerView, this)

    captioningChangeListener?.let { listener ->
      captioningManager?.addCaptioningChangeListener(listener)
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    orientationHelper.onConfigurationChanged(newConfig)
  }

  companion object {
    const val INTENT_FULLSCREEN_OPTIONS_KEY = "fullscreen_options"
  }
}
