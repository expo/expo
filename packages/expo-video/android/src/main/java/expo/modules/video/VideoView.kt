package expo.modules.video

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.view.accessibility.CaptioningManager
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import androidx.media3.common.Tracks
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
import expo.modules.video.listeners.VideoPlayerListener
import expo.modules.video.listeners.VideoViewListener
import expo.modules.video.records.AudioTrack
import expo.modules.video.records.SubtitleTrack
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VideoTrack
import expo.modules.video.records.FullscreenOptions
import expo.modules.video.utils.SubtitleUtils
import expo.modules.video.utils.dispatchMotionEvent
import expo.modules.video.managers.VideoManager
import expo.modules.video.managers.calculateCurrentPipAspectRatio
import expo.modules.video.records.PiPParams
import expo.modules.video.utils.calculateRectHint
import java.lang.ref.WeakReference
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

  // In some situations we can't detect if the view will enter PiP, in that case the playback will be paused
  // We can get an event after PiP has started, that's when we should resume playback
  var wasAutoPaused: Boolean = false
  var isInFullscreen: Boolean = false
    private set
  var showsSubtitlesButton = false
    private set
  var showsAudioTracksButton = false
    private set

  private var listeners = mutableListOf<WeakReference<VideoViewListener>>()
  private val currentActivity = appContext.throwingActivity
  private val decorView = currentActivity.window.decorView
  private val touchEventCoalescingKeyHelper = TouchEventCoalescingKeyHelper()
  private var reactNativeEventDispatcher: EventDispatcher? = null
  private var captioningChangeListener: CaptioningManager.CaptioningChangeListener? = null

  private val windowFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
    if (hasFocus) {
      // Reconfigure when window gains focus (returning from settings)
      SubtitleUtils.configureSubtitleView(playerView, context)
    }
  }

  var pipParams by IgnoreSameSet(PiPParams()) { new, old ->
    listeners.forEach {
      it.get()?.onPiPParamsChanged(this, old, new)
    }
  }
    private set

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
    pipParams = pipParams.copy(autoEnter = new)
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
      val oldPlayer = videoPlayer
      val hasEmittedFirstFrame = newPlayer?.firstFrameEventGenerator?.hasSentFirstFrameForCurrentMediaItem
        ?: false
      oldPlayer?.removeListener(this)
      newPlayer?.addListener(this)
      field = newPlayer
      shouldHideSurfaceView = !hasEmittedFirstFrame
      applySurfaceViewVisibility()
      attachPlayer()
      newPlayer?.let {
        VideoManager.onVideoPlayerAttachedToView(it, this)
      }
      if (oldPlayer != newPlayer) {
        oldPlayer?.hasBeenDisconnectedFromVideoView()
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

  var fullscreenOptions: FullscreenOptions = FullscreenOptions()
    set(value) {
      field = value
      if (value.enable) {
        playerView.setFullscreenButtonClickListener { enterFullscreen() }
      } else {
        playerView.setFullscreenButtonClickListener(null)
        playerView.setFullscreenButtonVisibility(false)
      }
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

    // Configure subtitle view to fix sizing issues with embedded styles
    SubtitleUtils.configureSubtitleView(playerView, context)
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
    intent.putExtra(FullscreenPlayerActivity.INTENT_FULLSCREEN_OPTIONS_KEY, fullscreenOptions)
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
    pipParams = pipParams.copy(blocksAppFromEntering = true)
  }

  fun attachPlayer() {
    videoPlayer?.changeVideoView(this)
  }

  fun exitFullscreen() {
    // Fullscreen uses a different PlayerView instance, because of that we need to manually update the non-fullscreen player icon after exiting
    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_enter)
    attachPlayer()
    onFullscreenExit(Unit)
    isInFullscreen = false
    pipParams = pipParams.copy(blocksAppFromEntering = false)
  }

  fun enterPictureInPicture() {
    if (!isPictureInPictureSupported(currentActivity)) {
      throw PictureInPictureUnsupportedException()
    }

    if (playerView.player == null) {
      throw PictureInPictureEnterException("No player attached to the VideoView")
    }

    pipParams = pipParams.copy(willEnter = true)
    VideoManager.pictureInPicture.enterPictureInPicture(this)
  }

  /**
   * @param pipCandidate - VideoView that was elected to be displayed in PiP
   */
  fun onStartPictureInPicture(pipCandidate: VideoView?) {
    onPictureInPictureStart(Unit)
  }

  /**
   * @param pipCandidate - VideoView that was being displayed in PiP
   */
  fun onStopPictureInPicture(pipCandidate: VideoView?) {
    pipParams = pipParams.copy(willEnter = false)
    onPictureInPictureStop(Unit)
  }

  fun addVideoViewListener(listener: VideoViewListener) {
    if (listeners.any { it.get() == listener }) {
      return
    }
    listeners.add(WeakReference(listener))
  }

  fun removeVideoViewListener(listener: VideoViewListener) {
    listeners.retainAll { it.get() != listener }
  }

  override fun onVideoSourceLoaded(
    player: VideoPlayer,
    videoSource: VideoSource?,
    duration: Double?,
    availableVideoTracks: List<VideoTrack>,
    availableSubtitleTracks: List<SubtitleTrack>,
    availableAudioTracks: List<AudioTrack>
  ) {
    pipParams = pipParams.copy(aspectRatio = calculateCurrentPipAspectRatio())
    super.onVideoSourceLoaded(player, videoSource, duration, availableVideoTracks, availableSubtitleTracks, availableAudioTracks)
  }

  override fun onIsPlayingChanged(player: VideoPlayer, isPlaying: Boolean, oldIsPlaying: Boolean?) {
    if (player == videoPlayer && isPlaying) {
      wasAutoPaused = false
    }
  }

  override fun onTracksChanged(player: VideoPlayer, tracks: Tracks) {
    showsSubtitlesButton = player.subtitles.availableSubtitleTracks.isNotEmpty()
    showsAudioTracksButton = player.audioTracks.availableAudioTracks.size > 1
    playerView.setShowSubtitleButton(showsSubtitlesButton)
    super.onTracksChanged(player, tracks)
  }

  override fun onRenderedFirstFrame(player: VideoPlayer) {
    if (player.currentVideoView == this) {
      shouldHideSurfaceView = false
      applySurfaceViewVisibility()
      onFirstFrameRender(Unit)
    }
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

    pipParams = pipParams.copy(rectHint = calculateRectHint(playerView))
    playerView.setTimeBarInteractive(videoPlayer?.requiresLinearPlayback ?: true)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    // Set up listener for accessibility caption changes when attached to window
    setupCaptioningChangeListener()
    // Reconfigure when view is attached (handles returning from settings)
    SubtitleUtils.configureSubtitleView(playerView, context)

    // Set up window focus change listener
    decorView.onFocusChangeListener = windowFocusChangeListener

    pipParams = pipParams.copy(canEnter = true)
  }

  override fun onVisibilityChanged(changedView: View, visibility: Int) {
    super.onVisibilityChanged(changedView, visibility)
    if (visibility == View.VISIBLE) {
      // Reconfigure subtitles when view becomes visible (immediate response)
      SubtitleUtils.configureSubtitleView(playerView, context)
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()

    // Clean up captioning change listener
    captioningChangeListener?.let {
      val captioningManager = context.getSystemService(Context.CAPTIONING_SERVICE) as? CaptioningManager
      captioningManager?.removeCaptioningChangeListener(it)
      captioningChangeListener = null
    }

    // Clean up window focus listener
    decorView.onFocusChangeListener = null

    pipParams = pipParams.copy(canEnter = false)
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

  private fun setupCaptioningChangeListener() {
    val captioningManager = context.getSystemService(Context.CAPTIONING_SERVICE) as? CaptioningManager

    captioningChangeListener = SubtitleUtils.createCaptioningChangeListener(playerView, context)

    captioningChangeListener?.let { listener ->
      captioningManager?.addCaptioningChangeListener(listener)
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
