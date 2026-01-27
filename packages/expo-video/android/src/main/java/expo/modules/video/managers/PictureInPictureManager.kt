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
import expo.modules.video.listeners.VideoManagerListener
import expo.modules.video.listeners.VideoViewListener
import expo.modules.video.records.PiPParams
import expo.modules.video.utils.applyPiPParams
import expo.modules.video.utils.applyRectHint
import expo.modules.video.utils.calculatePiPAspectRatio
import expo.modules.video.utils.calculateRectHint
import expo.modules.video.utils.isVisibleOnScreen
import expo.modules.video.utils.visiblePercentage
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class PictureInPictureManager(appContext: AppContext) : PictureInPictureFragmentListener, VideoManagerListener, VideoViewListener {
  private val appContext = WeakReference(appContext)
  private val mainActivity = WeakReference(appContext.currentActivity)

  var autoEnterPiP = false
    private set

  var isInPiP = false
    private set

  var currentPiPViewCandidate = WeakReference<VideoView>(null)
    private set

  private var pipHelperFragment: PictureInPictureHelperFragment? = null
  private val videoViews = mutableListOf<WeakReference<VideoView>>()
  private val strongVideoViews
    get() = videoViews.mapNotNull { it.get() }
  private val rootViewChildrenOriginalVisibility = mutableMapOf<Int, Int>()
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
   * Updates whether the main activity will auto-enter Picture in Picture, elects a new PiP candidate
   * and refreshes PiP parameters such as the rectHint.
   */
  private fun findAndSetupPipCandidate() {
    val newCandidate = findAutoPiPViewCandidate(strongVideoViews)
    currentPiPViewCandidate = WeakReference(newCandidate)

    val noBlockingView = strongVideoViews.none { it.pipParams.blocksAppFromEntering }
    val newAutoEnter = noBlockingView && strongVideoViews.any { it.pipParams.autoEnter && it.pipParams.canEnter }
    autoEnterPiP = newAutoEnter

    if (!newAutoEnter) {
      mainActivity.get()?.let {
        applyPiPParams(it, autoEnterPiP)
      }
    }

    newCandidate?.let {
      applyPipParamsForView(newCandidate)
    }
  }

  fun enterPictureInPicture(videoView: VideoView) {
    val mainActivity = mainActivity.get() ?: return

    currentPiPViewCandidate = WeakReference(videoView)
    applyPipParamsForView(videoView)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mainActivity.enterPictureInPictureMode(PictureInPictureParams.Builder().build())
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      @Suppress("DEPRECATION")
      mainActivity.enterPictureInPictureMode()
    }
  }

  private fun applyPipParamsForView(view: VideoView) {
    mainActivity.get()?.let {
      applyRectHint(it, calculateRectHint(view.playerView))
      applyPiPParams(it, autoEnterPiP, view.pipParams.aspectRatio)
    }
  }

  override fun onPiPParamsChanged(videoView: VideoView, oldPiPParams: PiPParams, newPiPParams: PiPParams) {
    val pipParamsInfluenceRectHint = pipParamChangeInfluenceRectHint(oldPiPParams, newPiPParams)
    if (paramChangeInfluencesAutoEnter(oldPiPParams, newPiPParams)) {
      findAndSetupPipCandidate()
    } else if (videoView == currentPiPViewCandidate.get() && pipParamsInfluenceRectHint) {
      applyPipParamsForView(videoView)
    }
  }

  private fun pipParamChangeInfluenceRectHint(old: PiPParams, new: PiPParams): Boolean {
    return old.rectHint != new.rectHint || old.aspectRatio != new.aspectRatio
  }

  override fun onPictureInPictureStart() {
    maybeWarnAboutAutoEnterViews()

    val candidate = currentPiPViewCandidate.get()
    candidate?.let {
      layoutForPiPEnter(it)
    }

    strongVideoViews.forEach {
      it.onStartPictureInPicture(candidate)
    }

    isInPiP = true
  }

  override fun onPictureInPictureStop() {
    if (!isInPiP) {
      return
    }

    currentPiPViewCandidate.get()?.let {
      layoutForPiPExit(it)
    }
    strongVideoViews.forEach {
      it.onStopPictureInPicture(currentPiPViewCandidate.get())
    }

    isInPiP = false
  }

  override fun onVideoViewRegistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {
    videoViews.add(WeakReference(videoView))

    if (videoViews.size == 1) {
      addPiPHelperFragment()
    }
    videoView.addVideoViewListener(this)

    electAutoPipViewCandidate()
  }

  override fun onVideoViewUnregistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {
    videoViews.retainAll { it.get() != videoView }

    if (videoViews.isEmpty()) {
      removePiPHelperFragment()
    }
    videoView.removeVideoViewListener(this)
    findAndSetupPipCandidate()
  }

  override fun onAppBackgrounded() {
    // At this point a view can know that it will enter PiP only if `enterPictureInPicture` method was called manually on it.
    // Therefore we know that this view is the source of the PiP notification and it should be chosen as the current PiP candidate.
    val enteringVideoView = strongVideoViews.firstOrNull { it.pipParams.willEnter }

    // If pictureInPicture wasn't started manually we need to elect a view to enter PiP.
    val candidate = enteringVideoView ?: findAutoPiPViewCandidate(strongVideoViews)
    currentPiPViewCandidate = WeakReference(candidate)

    candidate?.let {
      applyPipParamsForView(candidate)
    }

    // We receive this event before any info on app entering PiP
    // This is the earliest place where we can hide the player controls so that they
    // interfere as little as possible with the smoothness of the transition
    appContext.get()?.mainQueue?.launch {
      strongVideoViews.forEach {
        if (shouldPauseOnBackground(it)) {
          it.videoPlayer?.player?.pause()
          it.wasAutoPaused = true
        }
        it.playerView.useController = false
      }
    }
  }

  override fun onAppForegrounded() {
    // Undo changes from `onAppBackgrounded`
    appContext.get()?.mainQueue?.launch {
      strongVideoViews.forEach {
        it.playerView.useController = it.useNativeControls
      }
    }
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
    if (isInPiP) {
      return // Keep the current candidate when in PiP
    }
    val newCandidate = findAutoPiPViewCandidate(strongVideoViews)
    currentPiPViewCandidate = WeakReference(newCandidate)
  }

  private fun findAutoPiPViewCandidate(videoViews: List<VideoView>): VideoView? {
    val pipViews = videoViews.filter { it.pipParams.autoEnter }
    val visiblePiPView = pipViews.filter { it.isVisibleOnScreen() }.sortedBy { it.visiblePercentage() }.reversed()
    val playingPipViews = pipViews.filter { it.videoPlayer?.playing == true || it.wasAutoPaused }
    val visiblePlayingPipViews = visiblePiPView.filter { it.videoPlayer?.playing == true }
    val relevanceOrderedViews = listOf(visiblePlayingPipViews, playingPipViews, visiblePiPView, pipViews).flatten()

    return relevanceOrderedViews.firstOrNull()
  }

  private fun maybeWarnAboutAutoEnterViews() {
    val pipViews = strongVideoViews.filter { it.autoEnterPiP }

    // Ideally, we want users to have only one view with `startsPictureInPictureAutomatically`, if multiple exist we try to elect one that makes the most sense.
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
   * For an optimal picture in picture experience, it's best to only have one view. This method
   * hides all children of the root view and makes the player the only visible child of the rootView.
   */
  private fun layoutForPiPEnter(videoView: VideoView) {
    val mainActivity = mainActivity.get() ?: return
    val playerView = videoView.playerView
    val decorView = mainActivity.window.decorView
    val rootView = decorView.findViewById<ViewGroup>(android.R.id.content)

    (playerView.parent as? ViewGroup)?.removeView(playerView)
    for (i in 0 until rootView.childCount) {
      val child = rootView.getChildAt(i)
      if (child != playerView) {
        rootViewChildrenOriginalVisibility[child.id] = child.visibility
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
    videoView?.addView(playerView)

    for (i in 0 until rootView.childCount) {
      val child = rootView.getChildAt(i)
      rootViewChildrenOriginalVisibility[child.id]?.let {
        child.visibility = it
      }
    }
    rootViewChildrenOriginalVisibility.clear()
  }

  private fun paramChangeInfluencesAutoEnter(previous: PiPParams, new: PiPParams): Boolean {
    return previous.autoEnter != new.autoEnter || previous.canEnter != new.autoEnter || previous.blocksAppFromEntering != new.blocksAppFromEntering
  }

  private fun shouldPauseOnBackground(videoView: VideoView): Boolean {
    if (videoView.isInFullscreen) {
      return false
    }

    if (strongVideoViews.any { it.isInFullscreen }) {
      return true
    }

    val candidate = currentPiPViewCandidate.get()
    val params = videoView.pipParams
    val isHandledByPiPManager = params.autoEnter || params.willEnter // other views are handled by VideoManager
    val isCandidate = videoView == candidate

    if (candidate == null) {
      return !(videoView.videoPlayer?.staysActiveInBackground ?: false)
    }

    return isHandledByPiPManager && !isCandidate
  }
}

fun VideoView.calculateCurrentPipAspectRatio(): Rational? {
  val player = videoPlayer?.player ?: return null
  return calculatePiPAspectRatio(player.videoSize, this.width, this.height, contentFit)
}
