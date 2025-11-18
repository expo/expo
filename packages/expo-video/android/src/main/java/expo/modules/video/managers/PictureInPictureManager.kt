package expo.modules.video.managers

import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.OptIn
import androidx.fragment.app.FragmentActivity
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.video.PictureInPictureHelperFragment
import expo.modules.video.PictureInPictureFragmentListener
import expo.modules.video.VideoView
import expo.modules.video.utils.applyPiPParams
import expo.modules.video.utils.applyRectHint
import expo.modules.video.utils.calculatePiPAspectRatio
import expo.modules.video.utils.calculateRectHint
import expo.modules.video.utils.isVisibleOnScreen
import expo.modules.video.utils.visiblePercentage
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class PictureInPictureManager(appContext: AppContext) : PictureInPictureFragmentListener, VideoManagerListener {
  private val appContext = WeakReference(appContext)
  private val mainActivity = WeakReference(appContext.currentActivity)

  var autoEnterPiP = false
    private set

  var isInPiP = false
    private set

  var currentPiPViewCandidate: WeakReference<VideoView?> = WeakReference(null)
    private set

  private val candidateLayoutListener = View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
    currentPiPViewCandidate.get()?.playerView?.let {
      val mainActivity = mainActivity.get() ?: return@OnLayoutChangeListener
      if (!isInPiP) {
        applyRectHint(mainActivity, calculateRectHint(it))
      }
    }
  }

  private var pipHelperFragment: PictureInPictureHelperFragment? = null
  private val videoViews = mutableListOf<WeakReference<VideoView>>()
  private val strongVideoViews
    get() = videoViews.mapNotNull { it.get() }
  private val rootViewChildrenOriginalVisibility: ArrayList<Int> = arrayListOf()
  private var isReleased = false

  init {
    VideoManager.registerListener(this)
  }

  fun release() {
    if (isInPiP) {
      // VideoView most likely doesn't exist atp
      layoutForPiPExit(null)
    }

    videoViews.clear()
    removePiPHelperFragment()
    isReleased = true
  }

  /**
   * Updates whether the main activity will auto-enter Pictrue in Picture, elects a new PiP candidate
   * and refreshes PiP parameters such as the rectHint.
   */
  fun updateAutoEnterPiP() {
    electAutoPipViewCandidate()
    val noViewInFullscreen = strongVideoViews.none { it.isInFullscreen }
    val newAutoEnter = noViewInFullscreen && strongVideoViews.any { it.autoEnterPiP && it.isAttachedToWindow }

    currentPiPViewCandidate.get()?.let {
      setupForVideoViewEnter(it)
    }
    val aspectRatio = currentPiPViewCandidate.get()?.calculateCurrentPipAspectRatio()
    mainActivity.get()?.let {
      applyPiPParams(it, newAutoEnter, aspectRatio)
    }
    autoEnterPiP = newAutoEnter
  }

  fun forceDisableAutoEnterPiP() {
    autoEnterPiP = false
    mainActivity.get()?.let {
      applyPiPParams(it, false)
    }
  }

  fun enterPictureInPicture(videoView: VideoView) {
    val mainActivity = mainActivity.get() ?: return

    currentPiPViewCandidate = WeakReference(videoView)
    setupForVideoViewEnter(videoView)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mainActivity.enterPictureInPictureMode(PictureInPictureParams.Builder().build())
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      @Suppress("DEPRECATION")
      mainActivity.enterPictureInPictureMode()
    }
  }

  private fun setupForVideoViewEnter(view: VideoView) {
    mainActivity.get()?.let {
      val aspectRatio = view.calculateCurrentPipAspectRatio()
      applyRectHint(it, calculateRectHint(view.playerView))
      applyPiPParams(it, VideoManager.pictureInPicture.autoEnterPiP, aspectRatio)
    }
  }

  override fun onPictureInPictureStart() {
    maybeWarnAboutAutoEnterViews()

    // At this point a view can know that it will enter PiP only if `enterPictureInPicture` method was called manually on it.
    // Therefore we know that this view is the source of the PiP notification and it should be chosen as the current PiP candidate.
    val enteringVideoView = strongVideoViews.firstOrNull { it.willEnterPiP }

    // If pictureInPicture wasn't started manually we need to elect a view to enter PiP.
    electAutoPipViewCandidate()
    val candidate = enteringVideoView ?: findAutoPiPViewCandidate(strongVideoViews)
    currentPiPViewCandidate = WeakReference(candidate)

    candidate?.let {
      layoutForPiPEnter(it)
      if (it.wasAutoPaused) {
        appContext.get()?.mainQueue.run {
          it.videoPlayer?.player?.play()
        }
      }
    }

    strongVideoViews.forEach {
      it.onStartPictureInPicture(candidate)
    }

    isInPiP = true
  }

  override fun onPictureInPictureStop() {
    if (mainActivity.get() == null) {
      return
    }

    currentPiPViewCandidate.get()?.let {
      layoutForPiPExit(it)
    }
    strongVideoViews.forEach {
      it.onStopPictureInPicture(currentPiPViewCandidate.get())
    }
    electAutoPipViewCandidate()

    isInPiP = false
  }

  override fun onVideoViewRegistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {
    videoViews.add(WeakReference(videoView))

    if (videoViews.size == 1) {
      addPiPHelperFragment()
    }

    electAutoPipViewCandidate()
  }

  override fun onVideoViewUnregistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {
    videoViews.retainAll { it.get() != videoView }

    if (videoViews.isEmpty()) {
      removePiPHelperFragment()
    }
    currentPiPViewCandidate = WeakReference(findAutoPiPViewCandidate(strongVideoViews))
  }

  private fun addPiPHelperFragment() {
    (mainActivity.get() as? FragmentActivity)?.let {
      val fragment = PictureInPictureHelperFragment(this)
      pipHelperFragment = fragment
      it.supportFragmentManager.beginTransaction()
        .add(fragment, fragment.id)
        .commitAllowingStateLoss()
    }
  }

  private fun removePiPHelperFragment() {
    pipHelperFragment?.release()

    (mainActivity.get() as? FragmentActivity)?.let {
      val fragment = pipHelperFragment ?: return
      it.supportFragmentManager.beginTransaction()
        .remove(fragment)
        .commitAllowingStateLoss()
    }
  }

  private fun electAutoPipViewCandidate() {
    val newCandidate = findAutoPiPViewCandidate(strongVideoViews)
    currentPiPViewCandidate.get()?.removeOnLayoutChangeListener(candidateLayoutListener)

    newCandidate?.addOnLayoutChangeListener(candidateLayoutListener)
    currentPiPViewCandidate = WeakReference(newCandidate)
  }

  private fun findAutoPiPViewCandidate(videoViews: List<VideoView>): VideoView? {
    val pipViews = videoViews.filter { it.autoEnterPiP }
    val visiblePiPView = pipViews.filter { it.isVisibleOnScreen() }.sortedBy { it.visiblePercentage() }.reversed()
    val playingPipViews = pipViews.filter { it.videoPlayer?.playing == true }
    val visiblePlayingPipViews = visiblePiPView.filter { it.videoPlayer?.playing == true }
    val relevanceOrderedViews = listOf(visiblePlayingPipViews, playingPipViews, visiblePiPView, pipViews).flatten()

    return relevanceOrderedViews.firstOrNull()
  }

  private fun maybeWarnAboutAutoEnterViews() {
    val pipViews = strongVideoViews.filter { it.autoEnterPiP }

    // Ideally we want users to have only one view with `startsPictureInPictureAutomatically`, if multiple exist we try to elect one that makes the most sense.
    // We can only do the election **during** picture in picture transition, therefore we can't set the rectHint for the transition. That's why we show the warning.
    if (pipViews.size > 1) {
      appContext.get()?.jsLogger?.warn(
        "expo-video: Detected multiple `VideoViews` with `startsPictureInPictureAutomatically` set to `true`" +
          "while entering picture in picture. To ensure no visual issues when auto-entering PiP, make sure that there is only " +
          "one active `VideoView` with that property."
      )
    }
  }

  /**
   * For optimal picture in picture experience it's best to only have one view. This method
   * hides all children of the root view and makes the player the only visible child of the rootView.
   */
  private fun layoutForPiPEnter(videoView: VideoView) {
    val mainActivity = mainActivity.get() ?: return
    val playerView = videoView.playerView
    val decorView = mainActivity.window.decorView
    val rootView = decorView.findViewById<ViewGroup>(android.R.id.content)

    (playerView.parent as? ViewGroup)?.removeView(playerView)
    for (i in 0 until rootView.childCount) {
      if (rootView.getChildAt(i) != playerView) {
        rootViewChildrenOriginalVisibility.add(rootView.getChildAt(i).visibility)
        rootView.getChildAt(i).visibility = View.GONE
      }
    }
    rootView.addView(playerView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
  }

  private fun layoutForPiPExit(videoView: VideoView?) {
    val mainActivity = mainActivity.get() ?: return
    val playerView = videoView?.playerView
    val decorView = mainActivity.window.decorView
    val rootView = decorView.findViewById<ViewGroup>(android.R.id.content)

    rootView.removeView(playerView)

    for (i in 0 until rootView.childCount) {
      rootView.getChildAt(i).visibility = rootViewChildrenOriginalVisibility[i]
    }
    rootViewChildrenOriginalVisibility.clear()
    videoView?.addView(playerView)
  }
}

private fun VideoView.calculateCurrentPipAspectRatio(): Rational? {
  val player = videoPlayer?.player ?: return null
  return calculatePiPAspectRatio(player.videoSize, this.width, this.height, contentFit)
}
