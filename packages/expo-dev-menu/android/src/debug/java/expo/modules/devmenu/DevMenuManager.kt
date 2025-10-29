package expo.modules.devmenu

import android.app.Activity
import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.compose.DevMenuFragment
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.manifests.core.Manifest
import java.lang.ref.WeakReference

const val DEV_MENU_TAG = "ExpoDevMenu"

object DevMenuManager : LifecycleEventListener {
  data class KeyCommand(val code: Int, val withShift: Boolean = false)

  data class Callback(val name: String, val shouldCollapse: Boolean)

  private var preferences: DevMenuPreferencesHandle? = null
  internal var delegate: DevMenuDefaultDelegate? = null
  private var shouldLaunchDevMenuOnStart: Boolean = false
  private var currentReactInstance: WeakReference<ReactHost?> = WeakReference(null)
  private var canLaunchDevMenuOnStart = true

  private var goToHomeAction: () -> Unit = {}

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null
  var launchUrl: String? = null

  //region helpers

  fun getReactHost(): ReactHost? {
    return delegate?.reactHost()
  }

  private val delegateReactContext: ReactContext?
    get() = delegate?.reactHost()?.currentReactContext

  private val delegateActivity: Activity?
    get() = delegateReactContext?.currentActivity

  //endregion

  //region init

  private fun setUpReactInstance(reactHost: ReactHost) {
    currentReactInstance = WeakReference(reactHost)

    if (reactHost.currentReactContext == null) {
      reactHost.addReactInstanceEventListener(object : ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          if (currentReactInstance.get() === reactHost) {
            handleLoadedDelegateContext(context)
          }
          reactHost.removeReactInstanceEventListener(this)
        }
      })
    } else {
      handleLoadedDelegateContext(reactHost.currentReactContext!!)
    }
  }

  private fun hasDisableOnboardingQueryParam(urlString: String): Boolean {
    return urlString.contains("disableOnboarding=1")
  }

  /**
   * Starts dev menu if wasn't initialized, prepares for opening menu at launch if needed and gets [DevMenuPreferencesHandler].
   * We can't open dev menu here, cause then the app will crash - two react instance try to render.
   * So we wait until the [reactContext] activity will be ready.
   */
  private fun handleLoadedDelegateContext(reactContext: ReactContext) {
    Log.i(DEV_MENU_TAG, "Delegate's context was loaded.")

    preferences = DevMenuPreferencesHandle.also {
      if (hasDisableOnboardingQueryParam(currentManifestURL.orEmpty()) ||
        hasDisableOnboardingQueryParam(launchUrl.orEmpty())
      ) {
        it.isOnboardingFinished = true
      }
    }.also {
      shouldLaunchDevMenuOnStart =
        canLaunchDevMenuOnStart && (it.showsAtLaunch || !it.isOnboardingFinished)
      if (shouldLaunchDevMenuOnStart) {
        reactContext.addLifecycleEventListener(this)
      }
    }
  }

  // captures any callbacks that are registered via the `registerDevMenuItems` module method
  // it is set and unset by the public facing `DevMenuModule`
  // when the DevMenuModule instance is unloaded (e.g between app loads) the callback list is reset to an empty list
  var registeredCallbacks = mutableListOf<Callback>()

  //endregion

  //region delegate's LifecycleEventListener

  override fun onHostResume() {
    delegateReactContext?.removeLifecycleEventListener(this)

    if (shouldLaunchDevMenuOnStart) {
      shouldLaunchDevMenuOnStart = false
      delegateActivity?.let { activity ->
        activity.runOnUiThread {
          openMenu(activity)
        }
      }
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  //endregion

  fun updateStateIfNeeded(devMenuFragment: DevMenuFragment) {
    val currentReactInstance = currentReactInstance.get() ?: return
    val appInfo = AppInfo.getAppInfo(currentReactInstance)
    devMenuFragment.viewModel.updateAppInfo(appInfo)
    devMenuFragment.viewModel.updateCustomItems(registeredCallbacks)
  }

  inline fun withBindingView(
    activity: Activity,
    crossinline action: (DevMenuFragment) -> Unit
  ) {
    activity.runOnUiThread {
      val fragment = DevMenuFragment.fragment { activity }.value
      if (fragment == null) {
        Log.e(DEV_MENU_TAG, "BindingView not found in the activity hierarchy.")
        return@runOnUiThread
      }

      updateStateIfNeeded(fragment)
      action(fragment)
    }
  }

  fun goToHome() {
    goToHomeAction()
  }

  fun openMenu(activity: Activity) =
    withBindingView(activity) { bindingView ->
      bindingView.viewModel.onAction(DevMenuAction.Open)
    }

  fun setDelegate(newDelegate: DevMenuDefaultDelegate) {
    Log.i(DEV_MENU_TAG, "Set new dev-menu delegate: ${newDelegate.javaClass}")
    // removes event listener for old delegate
    delegateReactContext?.removeLifecycleEventListener(this)

    delegate = newDelegate.apply {
      setUpReactInstance(this.reactHost())
    }
  }

  fun setGoToHomeAction(action: () -> Unit) {
    goToHomeAction = action
  }

  fun initializeWithReactHost(reactHost: ReactHost) {
    setDelegate(DevMenuDefaultDelegate(reactHost))
  }

  fun sendEventToDelegateBridge(eventName: String, eventData: Any?) {
    delegateReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(eventName, eventData)
  }

  fun isInitialized(): Boolean {
    return delegate !== null
  }

  fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    this.canLaunchDevMenuOnStart = canLaunchDevMenuOnStart
  }

  fun synchronizeDelegate() {
    val newReactInstance = requireNotNull(delegate).reactHost()
    if (newReactInstance != currentReactInstance.get()) {
      setUpReactInstance(newReactInstance)
    }
  }

  fun refreshCustomItems() {
    delegateActivity?.let { activity ->
      withBindingView(activity) { bindingView ->
        bindingView.viewModel.updateCustomItems(registeredCallbacks)
      }
    }
  }
}
