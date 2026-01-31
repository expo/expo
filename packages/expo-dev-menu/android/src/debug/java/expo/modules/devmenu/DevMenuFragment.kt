package expo.modules.devmenu

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application
import android.content.Context
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.commit
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.devmenu.compose.DevMenuViewModel
import expo.modules.devmenu.compose.newtheme.AppTheme
import expo.modules.devmenu.compose.ui.DevMenuBottomSheet
import expo.modules.devmenu.detectors.InterceptingWindowCallback
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.devmenu.fab.MovableFloatingActionButton
import expo.modules.devmenu.helpers.isAcceptingText
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

typealias GoHomeAction = () -> Unit
typealias AppInfoProvider = (application: Application, reactHost: ReactHost) -> DevMenuState.AppInfo?

@SuppressLint("ViewConstructor HELLO WORLD")
class DevMenuFragment(
  private val reactHostHolder: WeakReference<ReactHost>,
  private val preferences: DevMenuPreferences,
  private val goToHomeAction: GoHomeAction?,
  private val reloadAction: (() -> Unit)?,
  private val appInfoProvider: AppInfoProvider
) : Fragment() {
  val viewModel by viewModels<DevMenuViewModel> {
    DevMenuViewModel.Factory(
      reactHostHolder,
      preferences,
      goToHomeAction,
      reloadAction
    )
  }
  private val shakeDetector = ShakeDetector(this::onShakeDetected)
  private var originalWindowCallback: Window.Callback? = null

  private val reactHost: ReactHost?
    get() = reactHostHolder.get()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val shouldShowAtLaunch = preferences.showsAtLaunch || !preferences.isOnboardingFinished
    if (shouldShowAtLaunch) {
      showMenuAtLaunch()
    }
  }

  private fun showMenuAtLaunch() {
    val reactHost = reactHostHolder.get() ?: return

    // If the React Context is already initialized, we can open the menu right away.
    if (reactHost.currentReactContext != null) {
      viewModel.onAction(DevMenuAction.Open)
      return
    }

    // Otherwise, we add a listener to be notified when the context is ready.
    val onReactContext = object : ReactInstanceEventListener {
      override fun onReactContextInitialized(context: ReactContext) {
        val boundedContext = reactHost.currentReactContext
        // We check if that listener is called for the same context that is currently set in the host.
        if (boundedContext != null && boundedContext == context) {
          viewModel.onAction(DevMenuAction.Open)
        }
        reactHost.removeReactInstanceEventListener(this)
      }
    }

    reactHost.addReactInstanceEventListener(onReactContext)
  }

  override fun onStart() {
    super.onStart()

    reactHost?.let { reactHost ->
      val appInfo = appInfoProvider.invoke(
        requireContext().applicationContext as Application,
        reactHost
      ) ?: AppInfo.getAppInfo(
        requireContext().applicationContext as Application,
        reactHost
      )

      viewModel.updateAppInfo(
        appInfo
      )
    }

    shakeDetector.start(
      requireContext().getSystemService(Context.SENSOR_SERVICE) as SensorManager
    )

    // Wrap window callback to intercept touch events at the window level
    activity?.window?.let { window ->
      val fingerLongPressDetector = ThreeFingerLongPressDetector(
        lifecycleScope,
        ::onThreeFingerLongPressDetected
      )
      val weakSelf = this.weak()
      val keyEventDispatcher = { event: KeyEvent ->
        weakSelf.get()?.onKeyUp(event.keyCode, event) ?: false
      }

      val currentCallback = window.callback
      // Avoid wrapping multiple times
      if (currentCallback !is InterceptingWindowCallback) {
        originalWindowCallback = currentCallback
        window.callback =
          InterceptingWindowCallback(
            currentCallback,
            fingerLongPressDetector,
            keyEventDispatcher
          )
      } else {
        // When user reloads the app, the fragment is restarted but the window callback remains the same
        currentCallback.updateDetector(fingerLongPressDetector)
        currentCallback.updateKeyEventDispatcher(keyEventDispatcher)
      }
    }
  }

  override fun onStop() {
    super.onStop()
    shakeDetector.stop()

    originalWindowCallback?.let { original ->
      activity?.window?.callback = original
      originalWindowCallback = null
    }
  }

  override fun onResume() {
    super.onResume()
    updatePictureInPictureState()
  }

  override fun onPause() {
    super.onPause()
    updatePictureInPictureState()
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    val context = requireContext()
    return LinearLayout(context).apply {
      z = Float.MAX_VALUE
      addView(
        ComposeView(context).apply {
          setContent {
            AppTheme {
              DevMenuBottomSheet(viewModel.state, viewModel::onAction)
              MovableFloatingActionButton(
                state = viewModel.state,
                onRefreshPress = {
                  viewModel.onAction(DevMenuAction.Reload)
                },
                onOpenMenuPress = {
                  viewModel.onAction(DevMenuAction.Open)
                }
              )
            }
          }
        }
      )
    }
  }

  fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    val activity = activity ?: return false

    // The keyboard is active. We don't want to handle events that should go to text inputs.
    // RN uses onKeyUp to handle all events connected with dev options. We need to do the same to override them.
    // However, this event is also triggered when input is edited. A better way to handle that case
    // is use onKeyDown event. However, it doesn't work well with key commands and we can't override RN implementation in that approach.
    if (activity.isAcceptingText()) {
      return false
    }

    val keyCommand = KeyCommand(
      code = keyCode,
      withShift = event.modifiers and KeyEvent.META_SHIFT_MASK > 0
    )

    if (keyCommand == KeyCommand(KeyEvent.KEYCODE_MENU)) {
      viewModel.onAction(DevMenuAction.Toggle)
      return true
    }

    if (!preferences.keyCommandsEnabled) {
      return false
    }

    val devToolsDelegate = DevMenuDevToolsDelegate(
      reactHostHolder.get()?.devSupportManager.weak()
    )

    when (keyCommand) {
      KeyCommand(KeyEvent.KEYCODE_R) -> devToolsDelegate.reload()
      KeyCommand(KeyEvent.KEYCODE_P) -> devToolsDelegate.togglePerformanceMonitor()
      KeyCommand(KeyEvent.KEYCODE_I) -> devToolsDelegate.toggleElementInspector()
      else -> return false
    }

    viewModel.onAction(DevMenuAction.Close)
    return true
  }

  private fun onShakeDetected() {
    if (preferences.motionGestureEnabled) {
      toggleDevMenu()
    }
  }

  private fun onThreeFingerLongPressDetected() {
    if (preferences.touchGestureEnabled) {
      toggleDevMenu()
    }
  }

  private fun toggleDevMenu() {
    viewModel.onAction(DevMenuAction.Toggle)
  }

  private fun updatePictureInPictureState() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      viewModel.setInPictureInPictureMode(false)
      return
    }

    val isInPiP = activity?.isInPictureInPictureMode ?: false
    viewModel.setInPictureInPictureMode(isInPiP)
  }

  companion object {
    internal const val TAG = "ExpoDevMenuFragment"

    internal fun createFragmentHost(
      activity: Activity,
      reactHostHolder: WeakReference<ReactHost>,
      preferences: DevMenuPreferences,
      goToHomeAction: GoHomeAction?,
      reloadAction: (() -> Unit)?,
      appInfoProvider: AppInfoProvider
    ): ViewGroup {
      val layout = object : FrameLayout(activity) {
        init {
          // To add the fragment, the container needs to have an id
          id = generateViewId()
        }
      }

      createAndCommit(
        activity,
        layout,
        reactHostHolder,
        preferences,
        goToHomeAction,
        reloadAction,
        appInfoProvider
      )

      return layout
    }

    internal fun createAndCommit(
      activity: Activity,
      container: ViewGroup,
      reactHostHolder: WeakReference<ReactHost>,
      preferences: DevMenuPreferences,
      goToHomeAction: GoHomeAction?,
      reloadAction: (() -> Unit)?,
      appInfoProvider: AppInfoProvider
    ) {
      val fragmentManager = (activity as FragmentActivity).supportFragmentManager

      val fragment = DevMenuFragment(
        reactHostHolder,
        preferences,
        goToHomeAction,
        reloadAction,
        appInfoProvider
      )

      fragmentManager.commit(true) {
        setReorderingAllowed(true)
        add(container, fragment, TAG)
      }
    }

    internal fun findIn(activity: Activity?): DevMenuFragment? {
      val activity = activity ?: return null
      return (activity as FragmentActivity).supportFragmentManager.findFragmentByTag(TAG) as? DevMenuFragment
    }

    private data class KeyCommand(val code: Int, val withShift: Boolean = false)
  }
}
