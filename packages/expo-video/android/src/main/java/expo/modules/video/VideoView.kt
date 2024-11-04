package expo.modules.video

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.os.Build
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.fragment.app.FragmentActivity
import androidx.media3.common.Format
import androidx.media3.common.MimeTypes
import androidx.media3.common.Tracks
import androidx.media3.ui.PlayerView
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.yoga.YogaConstants
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.video.delegates.IgnoreSameSet
import expo.modules.video.drawing.OutlineProvider
import expo.modules.video.enums.ContentFit
import expo.modules.video.player.VideoPlayer
import expo.modules.video.player.VideoPlayerListener
import expo.modules.video.utils.applyAutoEnterPiP
import expo.modules.video.utils.applyRectHint
import expo.modules.video.utils.calculateRectHint
import expo.modules.video.utils.ifYogaDefinedUse
import java.util.UUID

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext), VideoPlayerListener {
  val id: String = UUID.randomUUID().toString()
  val playerView: PlayerView = PlayerView(context.applicationContext)
  val onPictureInPictureStart by EventDispatcher<Unit>()
  val onPictureInPictureStop by EventDispatcher<Unit>()
  val onFullscreenEnter by EventDispatcher<Unit>()
  val onFullscreenExit by EventDispatcher<Unit>()

  var willEnterPiP: Boolean = false

  // In some situations we can't detect if the view will enter PiP, in that case the playback will be paused
  // We can get an event after PiP has started, that's when we should resume playback
  var wasAutoPaused: Boolean = false
  var isInFullscreen: Boolean = false
    private set
  var showsSubtitlesButton = false
    private set

  private val currentActivity = appContext.throwingActivity
  private val decorView = currentActivity.window.decorView
  private val rootView = decorView.findViewById<ViewGroup>(android.R.id.content)

  private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()
  private var pictureInPictureHelperTag: String? = null

  private var shouldInvalided = false

  private val outlineProvider = OutlineProvider(context)

  @UnstableReactNativeAPI
  private val borderDrawableLazyHolder = lazy {
    CSSBackgroundDrawable(context).apply {
      callback = this@VideoView

      outlineProvider.borderRadiiConfig
        .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
        .withIndex()
        .forEach { (i, radius) ->
          if (i == 0) {
            setBorderRadius(BorderRadiusProp.BORDER_RADIUS, LengthPercentage(radius, LengthPercentageType.POINT))
          } else {
            setBorderRadius(BorderRadiusProp.entries[i - 1], LengthPercentage(radius, LengthPercentageType.POINT))
          }
        }
    }
  }

  @UnstableReactNativeAPI
  private val borderDrawable
    get() = borderDrawableLazyHolder.value

  var autoEnterPiP: Boolean by IgnoreSameSet(false) { new, _ ->
    applyAutoEnterPiP(currentActivity, new)
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
      playerView.player = newPlayer?.player
      field = newPlayer
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
    addView(
      playerView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
  }

  fun enterFullscreen() {
    val intent = Intent(context, FullscreenPlayerActivity::class.java)
    intent.putExtra(VideoManager.INTENT_PLAYER_KEY, id)
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
    applyAutoEnterPiP(currentActivity, false)
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
    applyAutoEnterPiP(currentActivity, autoEnterPiP)
  }

  fun enterPictureInPicture() {
    if (!isPictureInPictureSupported(currentActivity)) {
      throw PictureInPictureUnsupportedException()
    }

    val player = playerView.player
      ?: throw PictureInPictureEnterException("No player attached to the VideoView")
    playerView.useController = false

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      var aspectRatio = if (contentFit == ContentFit.CONTAIN) {
        Rational(player.videoSize.width, player.videoSize.height)
      } else {
        Rational(width, height)
      }
      // Android PiP doesn't support aspect ratios lower than 0.4184 or higher than 2.39
      if (aspectRatio.toFloat() > 2.39) {
        aspectRatio = Rational(239, 100)
      } else if (aspectRatio.toFloat() < 0.4184) {
        aspectRatio = Rational(10000, 4184)
      }

      currentActivity.setPictureInPictureParams(
        PictureInPictureParams
          .Builder()
          .setAspectRatio(aspectRatio)
          .build()
      )
    }

    willEnterPiP = true
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      currentActivity.enterPictureInPictureMode(PictureInPictureParams.Builder().build())
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      @Suppress("DEPRECATION")
      currentActivity.enterPictureInPictureMode()
    }
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

  override fun onTracksChanged(player: VideoPlayer, tracks: Tracks) {
    showsSubtitlesButton = hasSubtitles(tracks)
    playerView.setShowSubtitleButton(showsSubtitlesButton)
    super.onTracksChanged(player, tracks)
  }

  private fun hasSubtitles(tracks: Tracks): Boolean {
    for (group in tracks.groups) {
      for (i in 0..<group.length) {
        val format: Format = group.getTrackFormat(i)

        if (MimeTypes.isText(format.sampleMimeType)) {
          return true
        }
      }
    }
    return false
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

  @UnstableReactNativeAPI
  override fun draw(canvas: Canvas) {
    // When the border-radii are not all the same, a convex-path
    // is used for the Outline. Unfortunately clipping is not supported
    // for convex-paths and we fallback to Canvas clipping.
    outlineProvider.clipCanvasIfNeeded(canvas, this)

    super.draw(canvas)

    // Draw borders on top of the video
    if (borderDrawableLazyHolder.isInitialized()) {
      val newLayoutDirection = if (I18nUtil.instance.isRTL(context)) {
        LAYOUT_DIRECTION_RTL
      } else {
        LAYOUT_DIRECTION_LTR
      }

      borderDrawable.apply {
        layoutDirection = newLayoutDirection
        setBounds(0, 0, width, height)
        draw(canvas)
      }
    }
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
    applyAutoEnterPiP(currentActivity, autoEnterPiP)
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
    applyAutoEnterPiP(currentActivity, false)
  }

  @UnstableReactNativeAPI
  internal fun setBorderRadius(position: Int, borderRadius: Float) {
    val isInvalidated = outlineProvider.setBorderRadius(borderRadius, position)
    if (isInvalidated) {
      invalidateOutline()
      if (!outlineProvider.hasEqualCorners()) {
        shouldInvalided = true
      }
    }

    // Setting the border-radius doesn't necessarily mean that a border
    // should to be drawn. Only update the border-drawable when needed.
    if (borderDrawableLazyHolder.isInitialized()) {
      shouldInvalided = true
      val radius = borderRadius.ifYogaDefinedUse(PixelUtil::toPixelFromDIP)
      borderDrawableLazyHolder.value.apply {
        if (position == 0) {
          setBorderRadius(BorderRadiusProp.BORDER_RADIUS, LengthPercentage(radius, LengthPercentageType.POINT))
        } else {
          setBorderRadius(BorderRadiusProp.entries[position - 1], LengthPercentage(radius, LengthPercentageType.POINT))
        }
      }
    }
  }

  @UnstableReactNativeAPI
  internal fun setBorderWidth(position: Int, width: Float) {
    borderDrawable.setBorderWidth(position, width)
    shouldInvalided = true
  }

  @UnstableReactNativeAPI
  internal fun setBorderColor(position: Int, rgb: Int) {
    borderDrawable.setBorderColor(position, rgb)
    shouldInvalided = true
  }

  @UnstableReactNativeAPI
  internal fun setBorderStyle(style: String?) {
    borderDrawable.setBorderStyle(style)
    shouldInvalided = true
  }

  @UnstableReactNativeAPI
  fun didUpdateProps() {
    val hasBorder = if (borderDrawableLazyHolder.isInitialized()) {
      val spacings = listOf(
        Spacing.ALL,
        Spacing.LEFT,
        Spacing.RIGHT,
        Spacing.TOP,
        Spacing.BOTTOM,
        Spacing.START,
        Spacing.END
      )
      spacings
        .any {
          val boarderWidth = borderDrawable.getBorderWidthOrDefaultTo(YogaConstants.UNDEFINED, it)
          boarderWidth != YogaConstants.UNDEFINED && boarderWidth > 0f
        }
    } else {
      false
    }

    // We need to enable drawing on the view to draw the border or background
    setWillNotDraw(!isOpaque && !hasBorder)
    if (shouldInvalided) {
      shouldInvalided = false
      invalidate()
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
