package versioned.host.exp.exponent.modules.api.screens

import android.content.Context
import android.graphics.Canvas
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import androidx.fragment.app.FragmentTransaction
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerModule
import versioned.host.exp.exponent.modules.api.screens.Screen.StackAnimation
import versioned.host.exp.exponent.modules.api.screens.events.StackFinishTransitioningEvent
import java.util.Collections
import kotlin.collections.ArrayList
import kotlin.collections.HashSet
import host.exp.expoview.R

class ScreenStack(context: Context?) : ScreenContainer<ScreenStackFragment>(context) {
  private val mStack = ArrayList<ScreenStackFragment>()
  private val mDismissed: MutableSet<ScreenStackFragment> = HashSet()
  private val drawingOpPool: MutableList<DrawingOp> = ArrayList()
  private val drawingOps: MutableList<DrawingOp> = ArrayList()
  private var mTopScreen: ScreenStackFragment? = null
  private val mBackStackListener = FragmentManager.OnBackStackChangedListener {
    if (mFragmentManager?.backStackEntryCount == 0) {
      // when back stack entry count hits 0 it means the user's navigated back using hw back
      // button. As the "fake" transaction we installed on the back stack does nothing we need
      // to handle back navigation on our own.
      mTopScreen?.let { dismiss(it) }
    }
  }
  private val mLifecycleCallbacks: FragmentManager.FragmentLifecycleCallbacks = object : FragmentManager.FragmentLifecycleCallbacks() {
    override fun onFragmentResumed(fm: FragmentManager, f: Fragment) {
      if (mTopScreen === f) {
        setupBackHandlerIfNeeded(f)
      }
    }
  }
  private var mRemovalTransitionStarted = false
  private var isDetachingCurrentScreen = false
  private var reverseLastTwoChildren = false
  private var previousChildrenCount = 0
  var goingForward = false
  fun dismiss(screenFragment: ScreenStackFragment) {
    mDismissed.add(screenFragment)
    markUpdated()
  }

  override val topScreen: Screen?
    get() = mTopScreen?.screen
  val rootScreen: Screen
    get() {
      var i = 0
      val size = screenCount
      while (i < size) {
        val screen = getScreenAt(i)
        if (!mDismissed.contains(screen.fragment)) {
          return screen
        }
        i++
      }
      throw IllegalStateException("Stack has no root screen set")
    }

  override fun adapt(screen: Screen): ScreenStackFragment {
    return ScreenStackFragment(screen)
  }

  override fun onDetachedFromWindow() {
    mFragmentManager?.let {
      it.removeOnBackStackChangedListener(mBackStackListener)
      it.unregisterFragmentLifecycleCallbacks(mLifecycleCallbacks)
      if (!it.isStateSaved && !it.isDestroyed) {
        // State save means that the container where fragment manager was installed has been
        // unmounted.
        // This could happen as a result of dismissing nested stack. In such a case we don't need to
        // reset back stack as it'd result in a crash caused by the fact the fragment manager is no
        // longer attached.
        it.popBackStack(BACK_STACK_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE)
      }
    }
    super.onDetachedFromWindow()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val fragmentManager = requireNotNull(mFragmentManager, { "mFragmentManager is null when ScreenStack attached to window" })
    fragmentManager.registerFragmentLifecycleCallbacks(mLifecycleCallbacks, false)
  }

  override fun startViewTransition(view: View) {
    super.startViewTransition(view)
    mRemovalTransitionStarted = true
  }

  override fun endViewTransition(view: View) {
    super.endViewTransition(view)
    if (mRemovalTransitionStarted) {
      mRemovalTransitionStarted = false
      dispatchOnFinishTransitioning()
    }
  }

  fun onViewAppearTransitionEnd() {
    if (!mRemovalTransitionStarted) {
      dispatchOnFinishTransitioning()
    }
  }

  private fun dispatchOnFinishTransitioning() {
    (context as ReactContext)
      .getNativeModule(UIManagerModule::class.java)
      ?.eventDispatcher
      ?.dispatchEvent(StackFinishTransitioningEvent(id))
  }

  override fun removeScreenAt(index: Int) {
    val toBeRemoved = getScreenAt(index)
    mDismissed.remove(toBeRemoved.fragment)
    super.removeScreenAt(index)
  }

  override fun removeAllScreens() {
    mDismissed.clear()
    super.removeAllScreens()
  }

  override fun hasScreen(screenFragment: ScreenFragment?): Boolean {
    return super.hasScreen(screenFragment) && !mDismissed.contains(screenFragment)
  }

  override fun performUpdate() {

    // When going back from a nested stack with a single screen on it, we may hit an edge case
    // when all screens are dismissed and no screen is to be displayed on top. We need to gracefully
    // handle the case of newTop being NULL, which happens in several places below
    var newTop: ScreenStackFragment? = null // newTop is nullable, see the above comment ^
    var visibleBottom: ScreenStackFragment? = null // this is only set if newTop has TRANSPARENT_MODAL presentation mode
    isDetachingCurrentScreen = false // we reset it so the previous value is not used by mistake
    for (i in mScreenFragments.indices.reversed()) {
      val screen = mScreenFragments[i]
      if (!mDismissed.contains(screen)) {
        if (newTop == null) {
          newTop = screen
        } else {
          visibleBottom = screen
        }
        if (!isTransparent(screen)) {
          break
        }
      }
    }
    var shouldUseOpenAnimation = true
    var transition = FragmentTransaction.TRANSIT_FRAGMENT_OPEN
    var stackAnimation: StackAnimation? = null
    if (!mStack.contains(newTop)) {
      // if new top screen wasn't on stack we do "open animation" so long it is not the very first
      // screen on stack
      if (mTopScreen != null && newTop != null) {
        // there was some other screen attached before
        // if the previous top screen does not exist anymore and the new top was not on the stack
        // before, probably replace or reset was called, so we play the "close animation".
        // Otherwise it's open animation
        shouldUseOpenAnimation = (
          mScreenFragments.contains(mTopScreen) ||
            newTop.screen.replaceAnimation !== Screen.ReplaceAnimation.POP
          )
        stackAnimation = newTop.screen.stackAnimation
      } else if (mTopScreen == null && newTop != null) {
        // mTopScreen was not present before so newTop is the first screen added to a stack
        // and we don't want the animation when it is entering, but we want to send the
        // willAppear and Appear events to the user, which won't be sent by default if Screen's
        // stack animation is not NONE (see check for stackAnimation in onCreateAnimation in
        // ScreenStackFragment).
        // We don't do it if the stack is nested since the parent will trigger these events in child
        stackAnimation = StackAnimation.NONE
        if (newTop.screen.stackAnimation !== StackAnimation.NONE && !isNested) {
          goingForward = true
          newTop.dispatchOnWillAppear()
          newTop.dispatchOnAppear()
        }
      }
    } else if (mTopScreen != null && mTopScreen != newTop) {
      // otherwise if we are performing top screen change we do "close animation"
      shouldUseOpenAnimation = false
      stackAnimation = mTopScreen?.screen?.stackAnimation
    }

    getOrCreateTransaction().let {
      // animation logic start
      if (stackAnimation != null) {
        if (shouldUseOpenAnimation) {
          transition = FragmentTransaction.TRANSIT_FRAGMENT_OPEN
          when (stackAnimation) {
            StackAnimation.SLIDE_FROM_RIGHT -> it.setCustomAnimations(R.anim.rns_slide_in_from_right, R.anim.rns_slide_out_to_left)
            StackAnimation.SLIDE_FROM_LEFT -> it.setCustomAnimations(R.anim.rns_slide_in_from_left, R.anim.rns_slide_out_to_right)
            StackAnimation.SLIDE_FROM_BOTTOM -> it.setCustomAnimations(
              R.anim.rns_slide_in_from_bottom, R.anim.rns_no_animation_medium
            )
            StackAnimation.FADE_FROM_BOTTOM -> it.setCustomAnimations(R.anim.rns_fade_from_bottom, R.anim.rns_no_animation_350)
            else -> {
            }
          }
        } else {
          transition = FragmentTransaction.TRANSIT_FRAGMENT_CLOSE
          when (stackAnimation) {
            StackAnimation.SLIDE_FROM_RIGHT -> it.setCustomAnimations(R.anim.rns_slide_in_from_left, R.anim.rns_slide_out_to_right)
            StackAnimation.SLIDE_FROM_LEFT -> it.setCustomAnimations(R.anim.rns_slide_in_from_right, R.anim.rns_slide_out_to_left)
            StackAnimation.SLIDE_FROM_BOTTOM -> it.setCustomAnimations(
              R.anim.rns_no_animation_medium, R.anim.rns_slide_out_to_bottom
            )
            StackAnimation.FADE_FROM_BOTTOM -> it.setCustomAnimations(R.anim.rns_no_animation_250, R.anim.rns_fade_to_bottom)
            else -> {
            }
          }
        }
      }
      if (stackAnimation === StackAnimation.NONE) {
        transition = FragmentTransaction.TRANSIT_NONE
      }
      if (stackAnimation === StackAnimation.FADE) {
        transition = FragmentTransaction.TRANSIT_FRAGMENT_FADE
      }
      if (stackAnimation != null && isSystemAnimation(stackAnimation)) {
        it.setTransition(transition)
      }
      // animation logic end
      goingForward = shouldUseOpenAnimation

      if (shouldUseOpenAnimation &&
        newTop != null && needsDrawReordering(newTop) &&
        visibleBottom == null
      ) {
        // When using an open animation in which two screens overlap (eg. fade_from_bottom or
        // slide_from_bottom), we want to draw the previous screen under the new one,
        // which is apparently not the default option. Android always draws the disappearing view
        // on top of the appearing one. We then reverse the order of the views so the new screen
        // appears on top of the previous one. You can read more about in the comment
        // for the code we use to change that behavior:
        // https://github.com/airbnb/native-navigation/blob/9cf50bf9b751b40778f473f3b19fcfe2c4d40599/lib/android/src/main/java/com/airbnb/android/react/navigation/ScreenCoordinatorLayout.java#L18
        isDetachingCurrentScreen = true
      }

      // remove all screens previously on stack
      for (screen in mStack) {
        if (!mScreenFragments.contains(screen) || mDismissed.contains(screen)) {
          it.remove(screen)
        }
      }
      for (screen in mScreenFragments) {
        // Stop detaching screens when reaching visible bottom. All screens above bottom should be
        // visible.
        if (screen === visibleBottom) {
          break
        }
        // detach all screens that should not be visible
        if (screen !== newTop && !mDismissed.contains(screen)) {
          it.remove(screen)
        }
      }

      // attach screens that just became visible
      if (visibleBottom != null && !visibleBottom.isAdded) {
        val top = newTop
        var beneathVisibleBottom = true
        for (screen in mScreenFragments) {
          // ignore all screens beneath the visible bottom
          if (beneathVisibleBottom) {
            beneathVisibleBottom = if (screen === visibleBottom) {
              false
            } else continue
          }
          // when first visible screen found, make all screens after that visible
          it.add(id, screen).runOnCommit { top?.screen?.bringToFront() }
        }
      } else if (newTop != null && !newTop.isAdded) {
        it.add(id, newTop)
      }
      mTopScreen = newTop
      mStack.clear()
      mStack.addAll(mScreenFragments)
      tryCommitTransaction()
      mTopScreen?.let { screen -> setupBackHandlerIfNeeded(screen) }
    }
  }

  override fun notifyContainerUpdate() {
    for (screen in mStack) {
      screen.onContainerUpdate()
    }
  }

  /**
   * The below method sets up fragment manager's back stack in a way that it'd trigger our back
   * stack change listener when hw back button is clicked.
   *
   *
   * Because back stack by default rolls back the transaction the stack entry is associated with
   * we generate a "fake" transaction that hides and shows the top fragment. As a result when back
   * stack entry is rolled back nothing happens and we are free to handle back navigation on our own
   * in `mBackStackListener`.
   *
   *
   * We pop that "fake" transaction each time we update stack and we add a new one in case the
   * top screen is allowed to be dismissed using hw back button. This way in the listener we can
   * tell if back button was pressed based on the count of the items on back stack. We expect 0
   * items in case hw back is pressed because we try to keep the number of items at 1 by always
   * resetting and adding new items. In case we don't add a new item to back stack we remove
   * listener so that it does not get triggered.
   *
   *
   * It is important that we don't install back handler when stack contains a single screen as in
   * that case we want the parent navigator or activity handler to take over.
   */
  private fun setupBackHandlerIfNeeded(topScreen: ScreenStackFragment) {
    if (mTopScreen?.isResumed != true) {
      // if the top fragment is not in a resumed state, adding back stack transaction would throw.
      // In such a case we skip installing back handler and use FragmentLifecycleCallbacks to get
      // notified when it gets resumed so that we can install the handler.
      return
    }
    mFragmentManager?.let {
      it.removeOnBackStackChangedListener(mBackStackListener)
      it.popBackStack(BACK_STACK_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE)
      var firstScreen: ScreenStackFragment? = null
      var i = 0
      val size = mStack.size
      while (i < size) {
        val screen = mStack[i]
        if (!mDismissed.contains(screen)) {
          firstScreen = screen
          break
        }
        i++
      }
      if (topScreen !== firstScreen && topScreen.isDismissible) {
        it
          .beginTransaction()
          .show(topScreen)
          .addToBackStack(BACK_STACK_TAG)
          .setPrimaryNavigationFragment(topScreen)
          .commitAllowingStateLoss()
        it.addOnBackStackChangedListener(mBackStackListener)
      }
    }
  }

  // below methods are taken from
  // https://github.com/airbnb/native-navigation/blob/9cf50bf9b751b40778f473f3b19fcfe2c4d40599/lib/android/src/main/java/com/airbnb/android/react/navigation/ScreenCoordinatorLayout.java#L43
  // and are used to swap the order of drawing views when navigating forward with the transitions
  // that are making transitioning fragments appear one on another. See more info in the comment to
  // the linked class.
  override fun removeView(view: View) {
    // we set this property to reverse the order of drawing views
    // when we want to push new fragment on top of the previous one and their animations collide.
    // More information in:
    // https://github.com/airbnb/native-navigation/blob/9cf50bf9b751b40778f473f3b19fcfe2c4d40599/lib/android/src/main/java/com/airbnb/android/react/navigation/ScreenCoordinatorLayout.java#L17
    if (isDetachingCurrentScreen) {
      isDetachingCurrentScreen = false
      reverseLastTwoChildren = true
    }
    super.removeView(view)
  }

  private fun drawAndRelease() {
    for (i in drawingOps.indices) {
      val op = drawingOps[i]
      op.draw()
      drawingOpPool.add(op)
    }
    drawingOps.clear()
  }

  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)

    // check the view removal is completed (by comparing the previous children count)
    if (drawingOps.size < previousChildrenCount) {
      reverseLastTwoChildren = false
    }
    previousChildrenCount = drawingOps.size
    if (reverseLastTwoChildren && drawingOps.size >= 2) {
      Collections.swap(drawingOps, drawingOps.size - 1, drawingOps.size - 2)
    }
    drawAndRelease()
  }

  override fun drawChild(canvas: Canvas, child: View, drawingTime: Long): Boolean {
    drawingOps.add(obtainDrawingOp().set(canvas, child, drawingTime))
    return true
  }

  private fun performDraw(op: DrawingOp) {
    super.drawChild(op.canvas, op.child, op.drawingTime)
  }

  private fun obtainDrawingOp(): DrawingOp {
    return if (drawingOpPool.isEmpty()) {
      DrawingOp()
    } else drawingOpPool.removeAt(drawingOpPool.size - 1)
  }

  private inner class DrawingOp {
    var canvas: Canvas? = null
    var child: View? = null
    var drawingTime: Long = 0
    operator fun set(canvas: Canvas?, child: View?, drawingTime: Long): DrawingOp {
      this.canvas = canvas
      this.child = child
      this.drawingTime = drawingTime
      return this
    }

    fun draw() {
      performDraw(this)
      canvas = null
      child = null
      drawingTime = 0
    }
  }

  companion object {
    private const val BACK_STACK_TAG = "RN_SCREEN_LAST"
    private fun isSystemAnimation(stackAnimation: StackAnimation): Boolean {
      return stackAnimation === StackAnimation.DEFAULT || stackAnimation === StackAnimation.FADE || stackAnimation === StackAnimation.NONE
    }

    private fun isTransparent(fragment: ScreenStackFragment): Boolean {
      return (
        fragment.screen.stackPresentation
          === Screen.StackPresentation.TRANSPARENT_MODAL
        )
    }

    private fun needsDrawReordering(fragment: ScreenStackFragment): Boolean {
      return (
        fragment.screen.stackAnimation === StackAnimation.SLIDE_FROM_BOTTOM ||
          fragment.screen.stackAnimation === StackAnimation.FADE_FROM_BOTTOM
        )
    }
  }
}
