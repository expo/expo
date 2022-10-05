package com.swmansion.rnscreens

import android.content.Context
import android.graphics.Canvas
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.swmansion.rnscreens.Screen.StackAnimation
import com.swmansion.rnscreens.events.StackFinishTransitioningEvent
import java.util.Collections
import kotlin.collections.ArrayList
import kotlin.collections.HashSet

class ScreenStack(context: Context?) : ScreenContainer<ScreenStackFragment>(context) {
    private val mStack = ArrayList<ScreenStackFragment>()
    private val mDismissed: MutableSet<ScreenStackFragment> = HashSet()
    private val drawingOpPool: MutableList<DrawingOp> = ArrayList()
    private var drawingOps: MutableList<DrawingOp> = ArrayList()
    private var mTopScreen: ScreenStackFragment? = null
    private var mRemovalTransitionStarted = false
    private var isDetachingCurrentScreen = false
    private var reverseLastTwoChildren = false
    private var previousChildrenCount = 0
    var goingForward = false

    fun dismiss(screenFragment: ScreenStackFragment) {
        mDismissed.add(screenFragment)
        performUpdatesNow()
    }

    override val topScreen: Screen?
        get() = mTopScreen?.screen

    val rootScreen: Screen
        get() {
            for (i in 0 until screenCount) {
                val screen = getScreenAt(i)
                if (!mDismissed.contains(screen.fragment)) {
                    return screen
                }
            }
            throw IllegalStateException("Stack has no root screen set")
        }

    override fun adapt(screen: Screen) = ScreenStackFragment(screen)

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
        UIManagerHelper
            .getEventDispatcherForReactTag((context as ReactContext), id)
            ?.dispatchEvent(StackFinishTransitioningEvent(id))
    }

    override fun removeScreenAt(index: Int) {
        mDismissed.remove(getScreenAt(index).fragment)
        super.removeScreenAt(index)
    }

    override fun removeAllScreens() {
        mDismissed.clear()
        super.removeAllScreens()
    }

    override fun hasScreen(screenFragment: ScreenFragment?): Boolean =
        super.hasScreen(screenFragment) && !mDismissed.contains(screenFragment)

    override fun onUpdate() {
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
        var stackAnimation: StackAnimation? = null
        if (!mStack.contains(newTop)) {
            // if new top screen wasn't on stack we do "open animation" so long it is not the very first
            // screen on stack
            if (mTopScreen != null && newTop != null) {
                // there was some other screen attached before
                // if the previous top screen does not exist anymore and the new top was not on the stack
                // before, probably replace or reset was called, so we play the "close animation".
                // Otherwise it's open animation
                val containsTopScreen = mTopScreen?.let { mScreenFragments.contains(it) } == true
                val isPushReplace = newTop.screen.replaceAnimation === Screen.ReplaceAnimation.PUSH
                shouldUseOpenAnimation = containsTopScreen || isPushReplace
                // if the replace animation is `push`, the new top screen provides the animation, otherwise the previous one
                stackAnimation = if (shouldUseOpenAnimation) newTop.screen.stackAnimation else mTopScreen?.screen?.stackAnimation
            } else if (mTopScreen == null && newTop != null) {
                // mTopScreen was not present before so newTop is the first screen added to a stack
                // and we don't want the animation when it is entering
                stackAnimation = StackAnimation.NONE
                goingForward = true
            }
        } else if (mTopScreen != null && mTopScreen != newTop) {
            // otherwise if we are performing top screen change we do "close animation"
            shouldUseOpenAnimation = false
            stackAnimation = mTopScreen?.screen?.stackAnimation
        }

        createTransaction().let {
            // animation logic start
            if (stackAnimation != null) {
                if (shouldUseOpenAnimation) {
                    when (stackAnimation) {
                        StackAnimation.DEFAULT -> it.setCustomAnimations(R.anim.rns_default_enter_in, R.anim.rns_default_enter_out)
                        StackAnimation.NONE -> it.setCustomAnimations(R.anim.rns_no_animation_20, R.anim.rns_no_animation_20)
                        StackAnimation.FADE -> it.setCustomAnimations(R.anim.rns_fade_in, R.anim.rns_fade_out)
                        StackAnimation.SLIDE_FROM_RIGHT -> it.setCustomAnimations(R.anim.rns_slide_in_from_right, R.anim.rns_slide_out_to_left)
                        StackAnimation.SLIDE_FROM_LEFT -> it.setCustomAnimations(R.anim.rns_slide_in_from_left, R.anim.rns_slide_out_to_right)
                        StackAnimation.SLIDE_FROM_BOTTOM -> it.setCustomAnimations(
                            R.anim.rns_slide_in_from_bottom, R.anim.rns_no_animation_medium
                        )
                        StackAnimation.FADE_FROM_BOTTOM -> it.setCustomAnimations(R.anim.rns_fade_from_bottom, R.anim.rns_no_animation_350)
                    }
                } else {
                    when (stackAnimation) {
                        StackAnimation.DEFAULT -> it.setCustomAnimations(R.anim.rns_default_exit_in, R.anim.rns_default_exit_out)
                        StackAnimation.NONE -> it.setCustomAnimations(R.anim.rns_no_animation_20, R.anim.rns_no_animation_20)
                        StackAnimation.FADE -> it.setCustomAnimations(R.anim.rns_fade_in, R.anim.rns_fade_out)
                        StackAnimation.SLIDE_FROM_RIGHT -> it.setCustomAnimations(R.anim.rns_slide_in_from_left, R.anim.rns_slide_out_to_right)
                        StackAnimation.SLIDE_FROM_LEFT -> it.setCustomAnimations(R.anim.rns_slide_in_from_right, R.anim.rns_slide_out_to_left)
                        StackAnimation.SLIDE_FROM_BOTTOM -> it.setCustomAnimations(
                            R.anim.rns_no_animation_medium, R.anim.rns_slide_out_to_bottom
                        )
                        StackAnimation.FADE_FROM_BOTTOM -> it.setCustomAnimations(R.anim.rns_no_animation_250, R.anim.rns_fade_to_bottom)
                    }
                }
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

            turnOffA11yUnderTransparentScreen(visibleBottom)

            it.commitNowAllowingStateLoss()
        }
    }

    // only top visible screen should be accessible
    private fun turnOffA11yUnderTransparentScreen(visibleBottom: ScreenStackFragment?) {
        if (mScreenFragments.size > 1 && visibleBottom != null) {
            mTopScreen?.let {
                if (isTransparent(it)) {
                    val screenFragmentsBeneathTop = mScreenFragments.slice(0 until mScreenFragments.size - 1).asReversed()
                    // go from the top of the stack excluding the top screen
                    for (screenFragment in screenFragmentsBeneathTop) {
                        screenFragment.screen.changeAccessibilityMode(IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS)

                        // don't change a11y below non-transparent screens
                        if (screenFragment == visibleBottom) {
                            break
                        }
                    }
                }
            }
        }

        topScreen?.changeAccessibilityMode(IMPORTANT_FOR_ACCESSIBILITY_AUTO)
    }

    override fun notifyContainerUpdate() {
        mStack.forEach { it.onContainerUpdate() }
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
        // We make a copy of the drawingOps and use it to dispatch draws in order to be sure
        // that we do not modify the original list. There are cases when `op.draw` can call
        // `drawChild` which would modify the list through which we are iterating. See more:
        // https://github.com/software-mansion/react-native-screens/pull/1406
        val drawingOpsCopy = drawingOps
        drawingOps = ArrayList()
        for (op in drawingOpsCopy) {
            op.draw()
            drawingOpPool.add(op)
        }
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

    private fun obtainDrawingOp(): DrawingOp =
        if (drawingOpPool.isEmpty()) DrawingOp() else drawingOpPool.removeAt(drawingOpPool.size - 1)

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
        private fun isTransparent(fragment: ScreenStackFragment): Boolean =
            fragment.screen.stackPresentation === Screen.StackPresentation.TRANSPARENT_MODAL

        private fun needsDrawReordering(fragment: ScreenStackFragment): Boolean =
            fragment.screen.stackAnimation === StackAnimation.SLIDE_FROM_BOTTOM ||
                fragment.screen.stackAnimation === StackAnimation.FADE_FROM_BOTTOM
    }
}
