package abi44_0_0.host.exp.exponent.modules.api.screens

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import abi44_0_0.com.facebook.react.bridge.ReactContext
import abi44_0_0.com.facebook.react.bridge.UiThreadUtil
import abi44_0_0.com.facebook.react.uimanager.UIManagerModule
import abi44_0_0.com.facebook.react.uimanager.events.Event
import abi44_0_0.host.exp.exponent.modules.api.screens.events.HeaderBackButtonClickedEvent
import abi44_0_0.host.exp.exponent.modules.api.screens.events.ScreenAppearEvent
import abi44_0_0.host.exp.exponent.modules.api.screens.events.ScreenDisappearEvent
import abi44_0_0.host.exp.exponent.modules.api.screens.events.ScreenDismissedEvent
import abi44_0_0.host.exp.exponent.modules.api.screens.events.ScreenTransitionProgressEvent
import abi44_0_0.host.exp.exponent.modules.api.screens.events.ScreenWillAppearEvent
import abi44_0_0.host.exp.exponent.modules.api.screens.events.ScreenWillDisappearEvent
import kotlin.math.max
import kotlin.math.min

open class ScreenFragment : Fragment {
  enum class ScreenLifecycleEvent {
    Appear, WillAppear, Disappear, WillDisappear
  }

  // if we call empty constructor, there is no screen to be assigned so not sure why it is suggested
  @Suppress("JoinDeclarationAndAssignment")
  lateinit var screen: Screen
  private val mChildScreenContainers: MutableList<ScreenContainer<*>> = ArrayList()
  private var shouldUpdateOnResume = false
  // if we don't set it, it will be 0.0f at the beginning so the progress will not be sent
  // due to progress value being already 0.0f
  private var mProgress = -1f

  constructor() {
    throw IllegalStateException(
      "Screen fragments should never be restored. Follow instructions from https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067 to properly configure your main activity."
    )
  }

  @SuppressLint("ValidFragment")
  constructor(screenView: Screen) : super() {
    screen = screenView
  }

  override fun onResume() {
    super.onResume()
    if (shouldUpdateOnResume) {
      shouldUpdateOnResume = false
      ScreenWindowTraits.trySetWindowTraits(screen, tryGetActivity(), tryGetContext())
    }
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val wrapper = context?.let { FrameLayout(it) }

    val params = FrameLayout.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
    )
    screen.layoutParams = params
    wrapper?.addView(recycleView(screen))
    return wrapper
  }

  open fun onContainerUpdate() {
    updateWindowTraits()
  }

  private fun updateWindowTraits() {
    val activity: Activity? = activity
    if (activity == null) {
      shouldUpdateOnResume = true
      return
    }
    ScreenWindowTraits.trySetWindowTraits(screen, activity, tryGetContext())
  }

  fun tryGetActivity(): Activity? {
    activity?.let { return it }
    val context = screen.context
    if (context is ReactContext && context.currentActivity != null) {
      return context.currentActivity
    }
    var parent: ViewParent? = screen.container
    while (parent != null) {
      if (parent is Screen) {
        val fragment = parent.fragment
        fragment?.activity?.let { return it }
      }
      parent = parent.parent
    }
    return null
  }

  fun tryGetContext(): ReactContext? {
    if (context is ReactContext) {
      return context as ReactContext
    }
    if (screen.context is ReactContext) {
      return screen.context as ReactContext
    }
    var parent: ViewParent? = screen.container
    while (parent != null) {
      if (parent is Screen) {
        if (parent.context is ReactContext) {
          return parent.context as ReactContext
        }
      }
      parent = parent.parent
    }
    return null
  }

  val childScreenContainers: List<ScreenContainer<*>>
    get() = mChildScreenContainers

  fun dispatchOnWillAppear() {
    dispatchEvent(ScreenLifecycleEvent.WillAppear, this)

    dispatchTransitionProgress(0.0f, false)
  }

  fun dispatchOnAppear() {
    dispatchEvent(ScreenLifecycleEvent.Appear, this)

    dispatchTransitionProgress(1.0f, false)
  }

  protected fun dispatchOnWillDisappear() {
    dispatchEvent(ScreenLifecycleEvent.WillDisappear, this)

    dispatchTransitionProgress(0.0f, true)
  }

  protected fun dispatchOnDisappear() {
    dispatchEvent(ScreenLifecycleEvent.Disappear, this)

    dispatchTransitionProgress(1.0f, true)
  }

  private fun dispatchEvent(event: ScreenLifecycleEvent, fragment: ScreenFragment) {
    if (fragment is ScreenStackFragment) {
      fragment.screen.let {
        val lifecycleEvent: Event<*> = when (event) {
          ScreenLifecycleEvent.WillAppear -> ScreenWillAppearEvent(it.id)
          ScreenLifecycleEvent.Appear -> ScreenAppearEvent(it.id)
          ScreenLifecycleEvent.WillDisappear -> ScreenWillDisappearEvent(it.id)
          ScreenLifecycleEvent.Disappear -> ScreenDisappearEvent(it.id)
        }
        (it.context as ReactContext)
          .getNativeModule(UIManagerModule::class.java)
          ?.eventDispatcher
          ?.dispatchEvent(lifecycleEvent)
        fragment.dispatchEventInChildContainers(event)
      }
    }
  }

  private fun dispatchEventInChildContainers(event: ScreenLifecycleEvent) {
    for (sc in mChildScreenContainers) {
      if (sc.screenCount > 0) {
        sc.topScreen?.let {
          if (it.stackAnimation !== Screen.StackAnimation.NONE || isRemoving) {
            // we do not dispatch events in child when it has `none` animation
            // and we are going forward since then they will be dispatched in child via
            // `onCreateAnimation` of ScreenStackFragment
            sc.topScreen?.fragment?.let { fragment -> dispatchEvent(event, fragment) }
          }
        }
      }
    }
  }

  fun dispatchHeaderBackButtonClickedEvent() {
    (screen.context as ReactContext)
      .getNativeModule(UIManagerModule::class.java)
      ?.eventDispatcher
      ?.dispatchEvent(HeaderBackButtonClickedEvent(screen.id))
  }

  fun dispatchTransitionProgress(alpha: Float, closing: Boolean) {
    if (this is ScreenStackFragment) {
      if (mProgress != alpha) {
        mProgress = max(0.0f, min(1.0f, alpha))
                /* We want value of 0 and 1 to be always dispatched so we base coalescing key on the progress:
                 - progress is 0 -> key 1
                 - progress is 1 -> key 2
                 - progress is between 0 and 1 -> key 3
             */
        val coalescingKey = (if (mProgress == 0.0f) 1 else if (mProgress == 1.0f) 2 else 3).toShort()
        val container: ScreenContainer<*>? = screen.container
        val goingForward = if (container is ScreenStack) container.goingForward else false
        (screen.context as ReactContext)
          .getNativeModule(UIManagerModule::class.java)
          ?.eventDispatcher
          ?.dispatchEvent(
            ScreenTransitionProgressEvent(
              screen.id, mProgress, closing, goingForward, coalescingKey
            )
          )
      }
    }
  }

  fun registerChildScreenContainer(screenContainer: ScreenContainer<*>) {
    mChildScreenContainers.add(screenContainer)
  }

  fun unregisterChildScreenContainer(screenContainer: ScreenContainer<*>) {
    mChildScreenContainers.remove(screenContainer)
  }

  fun onViewAnimationStart() {
    // onViewAnimationStart is triggered from View#onAnimationStart method of the fragment's root
    // view. We override Screen#onAnimationStart and an appropriate method of the StackFragment's
    // root view in order to achieve this.
    if (isResumed) {
      // Android dispatches the animation start event for the fragment that is being added first
      // however we want the one being dismissed first to match iOS. It also makes more sense from
      // a navigation point of view to have the disappear event first.
      // Since there are no explicit relationships between the fragment being added / removed the
      // practical way to fix this is delaying dispatching the appear events at the end of the
      // frame.
      UiThreadUtil.runOnUiThread { dispatchOnWillAppear() }
    } else {
      dispatchOnWillDisappear()
    }
  }

  open fun onViewAnimationEnd() {
    // onViewAnimationEnd is triggered from View#onAnimationEnd method of the fragment's root view.
    // We override Screen#onAnimationEnd and an appropriate method of the StackFragment's root view
    // in order to achieve this.
    if (isResumed) {
      // See the comment in onViewAnimationStart for why this event is delayed.
      UiThreadUtil.runOnUiThread { dispatchOnAppear() }
    } else {
      dispatchOnDisappear()
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    val container = screen.container
    if (container == null || !container.hasScreen(this)) {
      // we only send dismissed even when the screen has been removed from its container
      if (screen.context is ReactContext) {
        (screen.context as ReactContext)
          .getNativeModule(UIManagerModule::class.java)
          ?.eventDispatcher
          ?.dispatchEvent(ScreenDismissedEvent(screen.id))
      }
    }
    mChildScreenContainers.clear()
  }

  companion object {
    @JvmStatic
    protected fun recycleView(view: View): View {
      // screen fragments reuse view instances instead of creating new ones. In order to reuse a given
      // view it needs to be detached from the view hierarchy to allow the fragment to attach it back.
      val parent = view.parent
      if (parent != null) {
        (parent as ViewGroup).endViewTransition(view)
        parent.removeView(view)
      }

      // view detached from fragment manager get their visibility changed to GONE after their state is
      // dumped. Since we don't restore the state but want to reuse the view we need to change
      // visibility back to VISIBLE in order for the fragment manager to animate in the view.
      view.visibility = View.VISIBLE
      return view
    }
  }
}
