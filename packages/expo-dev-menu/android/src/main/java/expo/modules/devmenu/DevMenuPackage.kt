package expo.modules.devmenu

import android.app.Activity
import android.app.Application
import android.content.Context
import android.hardware.SensorManager
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.RequestHandler
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devmenu.compose.BindingView
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuViewModel
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.devmenu.helpers.getPrivateDeclaredFieldValue
import expo.modules.devmenu.helpers.isAcceptingText
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
import expo.modules.devmenu.react.DevMenuShakeDetectorListenerSwapper
import expo.modules.devmenu.websockets.DevMenuCommandHandlersProvider
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class DevMenuPackage : Package {
  private lateinit var threeFingerLongPressDetector: ThreeFingerLongPressDetector

  override fun createReactNativeHostHandlers(context: Context?): List<ReactNativeHostHandler?>? {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ReactNativeHostHandler {
        private lateinit var shakeDetector: ShakeDetector
        private var weakReactNativeHost = WeakReference<ReactHost>(null)

        override fun onDidCreateReactHost(context: Context, reactNativeHost: ReactHost) {
          super.onDidCreateReactHost(context, reactNativeHost)

          weakReactNativeHost = reactNativeHost.weak()

          if (::shakeDetector.isInitialized) {
            shakeDetector.stop()
          }

          shakeDetector = ShakeDetector(this::onShakeDetected).apply {
            start(context.getSystemService(Context.SENSOR_SERVICE) as SensorManager)
          }
          threeFingerLongPressDetector = ThreeFingerLongPressDetector(this::onThreeFingerLongPressDetected)
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
          val currentActivity = weakReactNativeHost.get()?.currentReactContext?.currentActivity
            ?: return
          val bindingView = BindingView.findIn(currentActivity) ?: return

          bindingView.viewModel.onAction(DevMenuAction.Toggle)
        }

        override fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager) {
          super.onDidCreateDevSupportManager(devSupportManager)

          if (devSupportManager !is DevSupportManagerBase) {
            return
          }

          val currentCommandHandlers =
            DevSupportManagerBase::class.java.getPrivateDeclaredFieldValue<_, Map<String, RequestHandler>?>(
              "customPackagerCommandHandlers",
              devSupportManager
            ) ?: emptyMap()

          val weakDevSupportManager = devSupportManager.weak()
          val handlers = DevMenuCommandHandlersProvider(weakDevSupportManager)
            .createCommandHandlers()

          val newCommandHandlers = currentCommandHandlers + handlers

          DevSupportManagerBase::class.java.setPrivateDeclaredFieldValue(
            "customPackagerCommandHandlers",
            devSupportManager,
            newCommandHandlers
          )

          DevMenuShakeDetectorListenerSwapper()
            .swapShakeDetectorListener(
              devSupportManager,
              newListener = {}
            )
        }
      }
    )
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          if (!DevMenuManager.isInitialized()) {
            val reactHost = (activity.application as ReactApplication).reactHost
            checkNotNull(reactHost) {
              "DevMenuManager.initializeWithReactHost() was called before reactHost was initialized"
            }
            DevMenuManager.initializeWithReactHost(reactHost)
          } else {
            DevMenuManager.synchronizeDelegate()
          }
        }
      }
    )
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityHandler {
        private var currentActivityHolder: WeakReference<Activity> = WeakReference(null)
        private val currentActivity
          get() = currentActivityHolder.get()

        private var reactHostHolder: WeakReference<ReactHost> = WeakReference(null)

        override fun onDidCreateReactActivityDelegateNotification(activity: ReactActivity?, delegate: ReactActivityDelegate?) {
          currentActivityHolder = activity.weak()
          reactHostHolder = delegate?.reactHost.weak()
        }

        override fun createReactRootViewContainer(activity: Activity): ViewGroup {
          val bindingView = BindingView(
            activity,
            lazyViewModel = (activity as AppCompatActivity).viewModels<DevMenuViewModel>(),
            reactHostHolder
          )

          val reactHost = reactHostHolder.get()
          if (reactHost != null) {
            bindingView.viewModel.updateAppInfo(
              AppInfo.getAppInfo(reactHost)
            )
          }

          val layout = object : FrameLayout(activity) {
            override fun onInterceptTouchEvent(event: MotionEvent?): Boolean {
              if (::threeFingerLongPressDetector.isInitialized) {
                threeFingerLongPressDetector.onTouchEvent(event)
              }
              return false
            }
          }
          layout.addView(bindingView)
          return layout
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          val activity = currentActivity ?: return false
          val bindingView = BindingView.findIn(activity) ?: return false
          val viewModel = bindingView.viewModel

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
            bindingView.reactHostHolder.get()?.devSupportManager.weak()
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
      }
    )
  }

  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener?>? {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ApplicationLifecycleListener {
        override fun onCreate(application: Application) {
          DevMenuPreferencesHandle.init(application)
          AppInfo.init(application)
        }
      }
    )
  }
}
