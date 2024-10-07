package expo.modules.video

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.fragment.app.FragmentActivity
import androidx.media3.ui.PlayerView
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.Spacing
import com.facebook.react.views.view.ReactViewBackgroundDrawable
import com.facebook.yoga.YogaConstants
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.video.delegates.IgnoreSameSet
import expo.modules.video.drawing.OutlineProvider
import expo.modules.video.enums.ContentFit
import expo.modules.video.player.VideoPlayer
import expo.modules.video.utils.ifYogaDefinedUse
import java.util.UUID

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VideoView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  val id: String = UUID.randomUUID().toString()
  val playerView: PlayerView = PlayerView(context.applicationContext)
  val onPictureInPictureStart by EventDispatcher<Unit>()
  val onPictureInPictureStop by EventDispatcher<Unit>()
  val onFullscreenEnter by EventDispatcher<Unit>()
  val onFullscreenExit by EventDispatcher<Unit>()

  var willEnterPiP: Boolean = false
  var isInFullscreen: Boolean = false
    private set

  private val currentActivity = appContext.throwingActivity
  private val decorView = currentActivity.window.decorView
  private val rootView = decorView.findViewById<ViewGroup>(android.R.id.content)

  private val rectHint: Rect = Rect()
  private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()

  private var pictureInPictureHelperTag: String? = null

  private var shouldInvalided = false

  private val outlineProvider = OutlineProvider(context)

  @UnstableReactNativeAPI
  private val borderDrawableLazyHolder = lazy {
    ReactViewBackgroundDrawable(context).apply {
      callback = this@VideoView

      outlineProvider.borderRadiiConfig
        .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
        .withIndex()
        .forEach { (i, radius) ->
          if (i == 0) {
            setRadius(radius)
          } else {
            setRadius(radius, i - 1)
          }
        }
    }
  }

  @UnstableReactNativeAPI
  private val borderDrawable
    get() = borderDrawableLazyHolder.value

  var autoEnterPiP: Boolean by IgnoreSameSet(false) { new, _ ->
    applyAutoEnterPiP(new)
  }

  var contentFit: ContentFit = ContentFit.CONTAIN
    set(value) {
      playerView.resizeMode = value.toResizeMode()
      field = value
    }

  var videoPlayer: VideoPlayer? = null
    set(videoPlayer) {
      field?.let {
        VideoManager.onVideoPlayerDetachedFromView(it, this)
      }
      playerView.player = videoPlayer?.player
      field = videoPlayer
      videoPlayer?.let {
        VideoManager.onVideoPlayerAttachedToView(it, this)
      }
    }

  var useNativeControls: Boolean = true
    set(value) {
      playerView.useController = value
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
    currentActivity.startActivity(intent)

    // Disable the enter transition
    if (Build.VERSION.SDK_INT >= 34) {
      currentActivity.overrideActivityTransition(Activity.OVERRIDE_TRANSITION_OPEN, 0, 0)
    } else {
      @Suppress("DEPRECATION")
      currentActivity.overridePendingTransition(0, 0)
    }
    onFullscreenEnter(Unit)
    isInFullscreen = true
  }

  fun exitFullscreen() {
    // Fullscreen uses a different PlayerView instance, because of that we need to manually update the non-fullscreen player icon after exiting
    val fullScreenButton: ImageButton = playerView.findViewById(androidx.media3.ui.R.id.exo_fullscreen)
    fullScreenButton.setImageResource(androidx.media3.ui.R.drawable.exo_icon_fullscreen_enter)
    videoPlayer?.changePlayerView(playerView)
    onFullscreenExit(Unit)
    isInFullscreen = false
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
          .setSourceRectHint(rectHint)
          .setAspectRatio(aspectRatio)
          .build()
      )
    }

    calculateRectHint()
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

  private fun calculateRectHint() {
    getGlobalVisibleRect(rectHint)

    // For `contain` contentFit we need to calculate where the video content is in the view and set the rectHint to that area
    if (contentFit == ContentFit.CONTAIN) {
      val player = playerView.player ?: return
      val width = playerView.width
      val height = playerView.height
      val videoWidth = player.videoSize.width
      val videoHeight = player.videoSize.height
      val videoRatio = videoWidth.toFloat() / videoHeight.toFloat()
      val viewRatio = width.toFloat() / height.toFloat()

      if (videoRatio > viewRatio) {
        val newHeight = (width.toFloat() / videoRatio).toInt()
        rectHint.set(rectHint.left, rectHint.top + (height - newHeight) / 2, rectHint.right, rectHint.bottom - (height - newHeight) / 2)
      } else {
        val newWidth = (height.toFloat() * videoRatio).toInt()
        rectHint.set(rectHint.left + (width - newWidth) / 2, rectHint.top, rectHint.right - (width - newWidth) / 2, rectHint.bottom)
      }
    }
  }

  private fun applyRectHint() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPictureInPictureSupported(currentActivity)) {
      runWithPiPMisconfigurationSoftHandling(ignore = true) {
        currentActivity.setPictureInPictureParams(PictureInPictureParams.Builder().setSourceRectHint(rectHint).build())
      }
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
    playerView.setTimeBarInteractive(videoPlayer?.requiresLinearPlayback ?: true)

    calculateRectHint()
    applyRectHint()
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
    applyAutoEnterPiP(autoEnterPiP)
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
    applyAutoEnterPiP(false)
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
          setRadius(radius)
        } else {
          setRadius(radius, position - 1)
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
  internal fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    borderDrawable.setBorderColor(position, rgb, alpha)
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

  // We can't check if AndroidManifest.xml is configured properly, so we have to handle the exceptions ourselves to prevent crashes
  internal fun runWithPiPMisconfigurationSoftHandling(shouldThrow: Boolean = false, ignore: Boolean = false, block: () -> Any?) {
    try {
      block()
    } catch (e: IllegalStateException) {
      if (ignore) {
        return
      }
      Log.e("ExpoVideo", "Current activity does not support picture-in-picture. Make sure you have configured the `expo-video` config plugin correctly.")
      if (shouldThrow) {
        throw PictureInPictureConfigurationException()
      }
    }
  }

  private fun applyAutoEnterPiP(autoEnterPiP: Boolean) {
    if (Build.VERSION.SDK_INT >= 31 && isPictureInPictureSupported(currentActivity)) {
      runWithPiPMisconfigurationSoftHandling {
        currentActivity.setPictureInPictureParams(PictureInPictureParams.Builder().setAutoEnterEnabled(autoEnterPiP).build())
      }
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
