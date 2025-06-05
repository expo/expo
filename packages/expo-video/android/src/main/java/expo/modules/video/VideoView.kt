package expo.modules.video

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.util.Rational
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.fragment.app.FragmentActivity
import androidx.media3.common.Tracks
import androidx.media3.common.VideoSize
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.video.delegates.IgnoreSameSet
import expo.modules.video.enums.ContentFit
import expo.modules.video.player.VideoPlayer
import expo.modules.video.player.VideoPlayerListener
import expo.modules.video.records.AudioTrack
import expo.modules.video.records.SubtitleTrack
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VideoTrack
import expo.modules.video.utils.applyPiPParams
import expo.modules.video.utils.applyRectHint
import expo.modules.video.utils.calculatePiPAspectRatio
import expo.modules.video.utils.calculateRectHint
import expo.modules.video.utils.dispatchMotionEvent
import java.util.UUID

class SurfaceVideoView(context: Context, appContext: AppContext) : VideoView(context, appContext)
class TextureVideoView(context: Context, appContext: AppContext) : VideoView(context, appContext, true)

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
open class VideoView(context: Context, appContext: AppContext, useTextureView: Boolean = false) : ExpoView(context, appContext), VideoPlayerListener {
  val videoViewId: String = UUID.randomUUID().toString()
  val playerView: PlayerView = LayoutInflater.from(context.applicationContext).inflate(getPlayerViewLayoutId(useTextureView), null) as PlayerView
  val onPictureInPictureStart by EventDispatcher<Unit>()
  val onPictureInPictureStop by EventDispatcher<Unit>()
  val onFullscreenEnter by EventDispatcher<Unit>()
  val onFullscreenExit by EventDispatcher<Unit>()
  val onFirstFrameRender by EventDispatcher<Unit>()

  var willEnterPiP: Boolean = false

  // In some situations we can't detect if the view will enter PiP, in that case the playback will be paused
  // We can get an event after PiP has started, that's when we should resume playback
  var wasAutoPaused: Boolean = false
  var isInFullscreen: Boolean = false
    private set
  var showsSubtitlesButton = false
    private set
  var showsAudioTracksButton = false
    private set

  private val currentActivity = appContext.throwingActivity
  private val decorView = currentActivity.window.decorView
  private val rootView = decorView.findViewById<ViewGroup>(android.R.id.content)
  private val touchEventCoalescingKeyHelper = TouchEventCoalescingKeyHelper()

  private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()
  private var pictureInPictureHelperTag: String? = null
  private var reactNativeEventDispatcher: EventDispatcher? = null

  // We need to keep track of the target surface view visibility, but only apply it when `useExoShutter` is false.
  var shouldHideSurfaceView: Boolean = true

  var useExoShutter: Boolean? = null
    set(value) {
      if (value == true) {
        playerView.setShutterBackgroundColor(Color.BLACK)
      } else {
        playerView.setShutterBackgroundColor(Color.TRANSPARENT)
      }
      applySurfaceViewVisibility()
      field = value
    }

  var autoEnterPiP: Boolean by IgnoreSameSet(false) { new, _ ->
    applyPiPParams(currentActivity, new, calculateCurrentPipAspectRatio())
  }

  var contentFit: ContentFit = ContentFit.CONTAIN
    set(value) {
      playerView.resizeMode = value.toResizeMode()
      field = value
    }

  var videoPlayer: VideoPlayer? = null
    set(newPlayer) {
      field?.let {
        VideoManager.onVideoPlayerDetachedFromView(it, this)
      }
      videoPlayer?.removeListener(this)
      newPlayer?.addListener(this)
      field = newPlayer
      shouldHideSurfaceView = true
      attachPlayer()
      newPlayer?.let {
        VideoManager.onVideoPlayerAttachedToView(it, this)
      }
    }

  var useNativeControls: Boolean = true
    set(value) {
      playerView.useController = value
      playerView.setShowSubtitleButton(value)
      field = value
    }

  var allowsFullscreen: Boolean = true
    set(value) {
      if (value) {
        playerView.setFullscreenButtonClickListener { enterFullscreen() }
      } else {
        playerView.setFullscreenButtonClickListener(null)
        // Setting listener to null should hide the button, but judging by ExoPlayer source code
        // there is a bug and the button isn't hidden. We need to do it manually.
        playerView.setFullscreenButtonVisibility(false)
      }
      field = value
    }

  private val mLayoutRunnable = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  init {
    VideoManager.registerVideoView(this)
    playerView.setFullscreenButtonClickListener { enterFullscreen() }
    // The prop `useNativeControls` prop is sometimes applied after the view is created, and sometimes there is a visible
    // flash of controls event when they are set to off. Initially we set it to `false` and apply it in `onAttachedToWindow` to avoid this.
    this.playerView.useController = false

    // Start with the SurfaceView being transparent to avoid any flickers when the prop value is delivered.
    this.playerView.setShutterBackgroundColor(Color.TRANSPARENT)
    this.playerView.videoSurfaceView?.alpha = 0f
    addView(
      playerView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    reactNativeEventDispatcher = UIManagerHelper.getEventDispatcher(appContext.reactContext as ReactContext, id)
  }

  fun applySurfaceViewVisibility() {
    if (useExoShutter != true && shouldHideSurfaceView) {
      playerView.videoSurfaceView?.alpha = 0f
    } else {
      playerView.videoSurfaceView?.alpha = 1f
    }
  }

  fun enterFullscreen() {
    val intent = Intent(context, FullscreenPlayerActivity::class.java)
    intent.putExtra(VideoManager.INTENT_PLAYER_KEY, videoViewId)
    // Set before starting the activity to avoid entering PiP unintentionally
    isInFullscreen = true
    currentActivity.startActivity(intent)

    // Disable the enter transition
    if (Build.VERSION.SDK_INT >= 34) {
      currentActivity.overrideActivityTransition(Activity.OVERRIDE_TRANSITION_OPEN, 0, 0)
    } else {
      @Suppress("DEPRECATION")
      currentActivity.overridePendingTransition(0, 0)
    }
    onFullscreenEnter(Unit)
    applyPiPParams(currentActivity, false, calculateCurrentPipAspectRatio())
  }

  fun attachPlayer() {
    videoPlayer?.changePlayerView(playerView)
  }

  fun exitFullscreen() {
    // Fullscreen uses a different PlayerView instance, because of that we need to manually update the non-fullscreen player icon after exiting
    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_enter)
    attachPlayer()
    onFullscreenExit(Unit)
    isInFullscreen = false
    applyPiPParams(currentActivity, autoEnterPiP, calculateCurrentPipAspectRatio())
  }

  fun enterPictureInPicture() {
    if (!isPictureInPictureSupported(currentActivity)) {
      throw PictureInPictureUnsupportedException()
    }

    val player = playerView.player
      ?: throw PictureInPictureEnterException("No player attached to the VideoView")
    playerView.useController = false
    applyPiPParams(currentActivity, autoEnterPiP, calculateCurrentPipAspectRatio())
    willEnterPiP = true

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      currentActivity.enterPictureInPictureMode(PictureInPictureParams.Builder().build())
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      @Suppress("DEPRECATION")
      currentActivity.enterPictureInPictureMode()
    }
  }

  private fun calculateCurrentPipAspectRatio(): Rational? {
    val player = videoPlayer?.player ?: return null
    return calculatePiPAspectRatio(player.videoSize, this.width, this.height, contentFit)
  }

  /**
   * For optimal picture in picture experience it's best to only have one view. This method
   * hides all children of the root view and makes the player the only visible child of the rootView.
   */
  fun layoutForPiPEnter() {
    playerView.useController = false
    (playerView.parent as? ViewGroup)?.removeView(playerView)
    for (i in 0 until rootView.childCount) {
      if (rootView.getChildAt(i) != playerView) {
        rootViewChildrenOriginalVisibility.add(rootView.getChildAt(i).visibility)
        rootView.getChildAt(i).visibility = View.GONE
      }
    }
    rootView.addView(playerView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
  }

  fun layoutForPiPExit() {
    playerView.useController = useNativeControls
    rootView.removeView(playerView)
    for (i in 0 until rootView.childCount) {
      rootView.getChildAt(i).visibility = rootViewChildrenOriginalVisibility[i]
    }
    rootViewChildrenOriginalVisibility.clear()
    this.addView(playerView)
  }

  override fun onVideoSourceLoaded(
    player: VideoPlayer,
    videoSource: VideoSource?,
    duration: Double?,
    availableVideoTracks: List<VideoTrack>,
    availableSubtitleTracks: List<SubtitleTrack>,
    availableAudioTracks: List<AudioTrack>
  ) {
    availableVideoTracks.firstOrNull()?.let {
      val videoSize = VideoSize(it.size.width, it.size.height)
      val aspectRatio = calculatePiPAspectRatio(videoSize, this.width, this.height, contentFit)
      applyPiPParams(currentActivity, autoEnterPiP, aspectRatio)
    }
    super.onVideoSourceLoaded(player, videoSource, duration, availableVideoTracks, availableSubtitleTracks, availableAudioTracks)
  }

  override fun onTracksChanged(player: VideoPlayer, tracks: Tracks) {
    showsSubtitlesButton = player.subtitles.availableSubtitleTracks.isNotEmpty()
    showsAudioTracksButton = player.audioTracks.availableAudioTracks.size > 1
    playerView.setShowSubtitleButton(showsSubtitlesButton)
    super.onTracksChanged(player, tracks)
  }

  override fun onRenderedFirstFrame(player: VideoPlayer) {
    shouldHideSurfaceView = false
    applySurfaceViewVisibility()
    onFirstFrameRender(Unit)
  }

  override fun requestLayout() {
    super.requestLayout()

    // Code borrowed from:
    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166
    // This fixes some layout issues with the exoplayer which caused the resizeMode to not work properly
    post(mLayoutRunnable)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    // On every re-layout ExoPlayer resets the timeBar to be enabled.
    // We need to disable it to keep scrubbing impossible.
    playerView.setTimeBarInteractive(videoPlayer?.requiresLinearPlayback ?: true)
    applyRectHint(currentActivity, calculateRectHint(playerView))
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    (currentActivity as? FragmentActivity)?.let {
      val fragment = PictureInPictureHelperFragment(this)
      pictureInPictureHelperTag = fragment.id
      it.supportFragmentManager.beginTransaction()
        .add(fragment, fragment.id)
        .commitAllowingStateLoss()
    }
    applyPiPParams(currentActivity, autoEnterPiP)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    (currentActivity as? FragmentActivity)?.let {
      val fragment = it.supportFragmentManager.findFragmentByTag(pictureInPictureHelperTag ?: "")
        ?: return
      it.supportFragmentManager.beginTransaction()
        .remove(fragment)
        .commitAllowingStateLoss()
    }
    applyPiPParams(currentActivity, false)
  }

  // After adding the `PlayerView` to the hierarchy the touch events stop being emitted to the JS side.
  // The only workaround I have found is to dispatch the touch events manually using the `EventDispatcher`.
  // The behavior is different when the native controls are enabled and disabled.
  override fun onTouchEvent(event: MotionEvent?): Boolean {
    if (!useNativeControls) {
      event?.eventTime?.let {
        touchEventCoalescingKeyHelper.addCoalescingKey(it)
        reactNativeEventDispatcher?.dispatchMotionEvent(this@VideoView, event, touchEventCoalescingKeyHelper)
      }
    }
    if (event?.actionMasked == MotionEvent.ACTION_UP) {
      performClick()
    }
    // Mark the event as handled
    return true
  }

  override fun onInterceptTouchEvent(event: MotionEvent?): Boolean {
    if (useNativeControls) {
      event?.eventTime?.let {
        touchEventCoalescingKeyHelper.addCoalescingKey(it)
        reactNativeEventDispatcher?.dispatchMotionEvent(this@VideoView, MotionEvent.obtainNoHistory(event), touchEventCoalescingKeyHelper)
      }
    }
    // Return false to receive all other events before the target `onTouchEvent`
    return false
  }

  private fun getPlayerViewLayoutId(useTextureView: Boolean): Int {
    return if (useTextureView) {
      R.layout.texture_player_view
    } else {
      R.layout.surface_player_view
    }
  }

  companion object {
    fun isPictureInPictureSupported(currentActivity: Activity): Boolean {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && currentActivity.packageManager.hasSystemFeature(
        android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE
      )
    }
  }
}
