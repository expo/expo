package expo.modules.devmenu.compose

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.hardware.SensorManager
import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.compose.ui.platform.ComposeView
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.commit
import androidx.fragment.app.viewModels
import com.facebook.react.ReactHost
import expo.modules.devmenu.AppInfo
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.DevMenuPreferencesHandle
import expo.modules.devmenu.compose.newtheme.AppTheme
import expo.modules.devmenu.compose.ui.DevMenuBottomSheet
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.devmenu.fab.MovableFloatingActionButton
import expo.modules.devmenu.helpers.isAcceptingText
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference
import kotlin.reflect.KProperty

@SuppressLint("ViewConstructor")
class DevMenuFragment(
  val reactHostHolder: WeakReference<ReactHost>
) : Fragment() {
  val viewModel by viewModels<DevMenuViewModel> {
    DevMenuViewModel.Factory(reactHostHolder)
  }
  private val threeFingerLongPressDetector = ThreeFingerLongPressDetector(::onThreeFingerLongPressDetected)
  private val shakeDetector = ShakeDetector(this::onShakeDetected)

  override fun onStart() {
    super.onStart()

    val reactHost = reactHostHolder.get()
    if (reactHost != null) {
      viewModel.updateAppInfo(
        AppInfo.getAppInfo(reactHost)
      )
    }

    shakeDetector.start(
      requireContext().getSystemService(Context.SENSOR_SERVICE) as SensorManager
    )
  }

  override fun onStop() {
    super.onStop()
    shakeDetector.stop()
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
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

    val keyCommand = DevMenuManager.KeyCommand(
      code = keyCode,
      withShift = event.modifiers and KeyEvent.META_SHIFT_MASK > 0
    )

    if (keyCommand == DevMenuManager.KeyCommand(KeyEvent.KEYCODE_MENU)) {
      viewModel.onAction(DevMenuAction.Toggle)
      return true
    }

    if (!DevMenuPreferencesHandle.keyCommandsEnabled) {
      return false
    }

    val devToolsDelegate = DevMenuDevToolsDelegate(
      reactHostHolder.get()?.devSupportManager.weak()
    )

    when (keyCommand) {
      DevMenuManager.KeyCommand(KeyEvent.KEYCODE_R) -> devToolsDelegate.reload()
      DevMenuManager.KeyCommand(KeyEvent.KEYCODE_P) -> devToolsDelegate.togglePerformanceMonitor()
      DevMenuManager.KeyCommand(KeyEvent.KEYCODE_I) -> devToolsDelegate.toggleElementInspector()
      else -> return false
    }

    viewModel.onAction(DevMenuAction.Close)
    return true
  }

  private fun onShakeDetected() {
    if (DevMenuPreferencesHandle.motionGestureEnabled) {
      toggleDevMenu()
    }
  }

  private fun onThreeFingerLongPressDetected() {
    if (DevMenuPreferencesHandle.touchGestureEnabled) {
      toggleDevMenu()
    }
  }

  private fun toggleDevMenu() {
    viewModel.onAction(DevMenuAction.Toggle)
  }

  companion object {
    private const val TAG = "ExpoDevMenuFragment"

    fun fragment(
      activityProvider: () -> Activity?
    ) = FragmentDelegate(
      activityProvider,
      mapper = { it }
    )

    fun model(
      activityProvider: () -> Activity?
    ) = FragmentDelegate(
      activityProvider,
      mapper = { it.viewModel }
    )

    fun createFragmentHost(
      activity: Activity,
      reactHostHolder: WeakReference<ReactHost>
    ): ViewGroup {
      var fragmentHolder = WeakReference<DevMenuFragment>(null)
      val interceptTouchEventCallback: (event: MotionEvent?) -> Unit = { event ->
        fragmentHolder.get()?.threeFingerLongPressDetector?.onTouchEvent(event)
      }

      val layout = object : FrameLayout(activity) {
        init {
          // To add the fragment, the container needs to have an id
          id = generateViewId()
        }

        override fun onInterceptTouchEvent(event: MotionEvent?): Boolean {
          interceptTouchEventCallback(event)
          return false
        }
      }

      val fragment = addTo(activity, layout, reactHostHolder)
      @Suppress("AssignedValueIsNeverRead")
      fragmentHolder = fragment.weak()

      return layout
    }

    private fun addTo(
      activity: Activity,
      container: ViewGroup,
      reactHostHolder: WeakReference<ReactHost>
    ): DevMenuFragment {
      val fragmentManager = (activity as FragmentActivity).supportFragmentManager

      val fragment = DevMenuFragment(reactHostHolder)

      fragmentManager.commit(true) {
        setReorderingAllowed(true)
        add(container, fragment, TAG)
      }

      return fragment
    }

    private fun findIn(activity: Activity?): DevMenuFragment? {
      val activity = activity ?: return null
      return (activity as FragmentActivity).supportFragmentManager.findFragmentByTag(TAG) as DevMenuFragment
    }

    class FragmentDelegate<T>(
      private val activityProvider: () -> Activity?,
      private val mapper: (DevMenuFragment) -> T
    ) {
      val value: T?
        get() {
          val fragment = findIn(activityProvider()) ?: return null
          return mapper(fragment)
        }

      operator fun getValue(thisRef: Any?, property: KProperty<*>): T? = value
    }
  }
}
