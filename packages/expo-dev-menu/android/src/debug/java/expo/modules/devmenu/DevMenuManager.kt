package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.hardware.SensorManager
import android.util.Log
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import androidx.core.view.children
import com.facebook.react.ReactActivity
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.interfaces.devmenu.DevMenuDelegateInterface
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.interfaces.devmenu.DevMenuPreferencesInterface
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.api.DevMenuMetroClient
import expo.modules.devmenu.compose.BindingView
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.devmenu.react.DevMenuPackagerCommandHandlersSwapper
import expo.modules.devmenu.react.DevMenuShakeDetectorListenerSwapper
import expo.modules.devmenu.websockets.DevMenuCommandHandlersProvider
import expo.modules.manifests.core.Manifest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.lang.ref.WeakReference

const val DEV_MENU_TAG = "ExpoDevMenu"

object DevMenuManager : DevMenuManagerInterface, LifecycleEventListener {
  data class KeyCommand(val code: Int, val withShift: Boolean = false)

  data class Callback(val name: String, val shouldCollapse: Boolean)

  val metroClient: DevMenuMetroClient by lazy { DevMenuMetroClient() }

  private var shakeDetector: ShakeDetector? = null
  private var threeFingerLongPressDetector: ThreeFingerLongPressDetector? = null
  private var preferences: DevMenuPreferencesInterface? = null
  internal var delegate: DevMenuDelegateInterface? = null
  private var shouldLaunchDevMenuOnStart: Boolean = false
  private var currentReactInstance: WeakReference<ReactHostWrapper?> = WeakReference(null)
  private var canLaunchDevMenuOnStart = true

  private var goToHomeAction: () -> Unit = {}

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null
  var launchUrl: String? = null

  //region helpers

  fun getReactHost(): ReactHostWrapper? {
    return delegate?.reactHost()
  }

  fun getDevToolsDelegate(): DevMenuDevToolsDelegate? {
    val reactHost = getReactHost() ?: return null
    return DevMenuDevToolsDelegate(this, reactHost)
  }

  private val delegateReactContext: ReactContext?
    get() = delegate?.reactHost()?.currentReactContext

  private val delegateActivity: Activity?
    get() = delegateReactContext?.currentActivity

  //endregion

  //region init

  private fun setUpReactInstance(reactHost: ReactHostWrapper) {
    currentReactInstance = WeakReference(reactHost)

    val handlers = DevMenuCommandHandlersProvider(this, reactHost)
      .createCommandHandlers()

    DevMenuPackagerCommandHandlersSwapper()
      .swapPackagerCommandHandlers(
        reactHost,
        handlers
      )

    DevMenuShakeDetectorListenerSwapper()
      .swapShakeDetectorListener(
        reactHost
      ) {}

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
   * Starts dev menu if wasn't initialized, prepares for opening menu at launch if needed and gets [DevMenuPreferences].
   * We can't open dev menu here, cause then the app will crash - two react instance try to render.
   * So we wait until the [reactContext] activity will be ready.
   */
  private fun handleLoadedDelegateContext(reactContext: ReactContext) {
    Log.i(DEV_MENU_TAG, "Delegate's context was loaded.")

    maybeStartDetectors(reactContext.applicationContext)
    preferences = DevMenuPreferencesHandle.also {
      if (hasDisableOnboardingQueryParam(currentManifestURL.orEmpty()) || hasDisableOnboardingQueryParam(launchUrl.orEmpty())) {
        it.isOnboardingFinished = true
      }
    }.also {
      shouldLaunchDevMenuOnStart = canLaunchDevMenuOnStart && (it.showsAtLaunch || !it.isOnboardingFinished)
      if (shouldLaunchDevMenuOnStart) {
        reactContext.addLifecycleEventListener(this)
      }
    }
  }

  fun getDevSettings(): DevToolsSettings {
    val reactHost = delegate?.reactHost()
    if (reactHost != null) {
      return DevMenuDevSettings.getDevSettings(reactHost)
    }

    return DevToolsSettings()
  }

  // captures any callbacks that are registered via the `registerDevMenuItems` module method
  // it is set and unset by the public facing `DevMenuModule`
  // when the DevMenuModule instance is unloaded (e.g between app loads) the callback list is reset to an empty list
  var registeredCallbacks = mutableListOf<Callback>()

  //endregion

  //region shake detector

  /**
   * Starts [ShakeDetector] and [ThreeFingerLongPressDetector] if they aren't running yet.
   */
  private fun maybeStartDetectors(context: Context) {
    if (shakeDetector == null) {
      shakeDetector = ShakeDetector(this::onShakeGesture).apply {
        start(context.getSystemService(Context.SENSOR_SERVICE) as SensorManager)
      }
    }

    if (threeFingerLongPressDetector == null) {
      threeFingerLongPressDetector = ThreeFingerLongPressDetector(this::onThreeFingerLongPress)
    }
  }

  /**
   * Handles shake gesture which simply toggles the dev menu.
   */
  private fun onShakeGesture() {
    if (preferences?.motionGestureEnabled == true) {
      delegateActivity?.let {
        toggleMenu(it)
      }
    }
  }

  /**
   * Handles three finger long press which simply toggles the dev menu.
   */
  private fun onThreeFingerLongPress() {
    if (preferences?.touchGestureEnabled == true) {
      delegateActivity?.let {
        toggleMenu(it)
      }
    }
  }

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

  //region DevMenuManagerProtocol

  fun findBidingView(activity: Activity): BindingView? {
    val reactActivity = activity as? ReactActivity ?: return null
    val rootView = reactActivity.reactDelegate?.reactRootView ?: return null
    val parent = rootView.parent as? ViewGroup ?: return null
    val potentialBindingViews = parent
      .children
      .filter { it is BindingView }
      .map { it as BindingView }
      .toList()

    if (potentialBindingViews.size != 1) {
      Log.e(DEV_MENU_TAG, "There should be only one BindingView in the hierarchy, but found: ${potentialBindingViews.size}")
      return null
    }

    return potentialBindingViews.first()
  }

  fun updateStateIfNeeded(activity: Activity, bindingView: BindingView) {
    val currentReactInstance = currentReactInstance.get() ?: return
    val appInfo = AppInfo.getAppInfo(currentReactInstance)
    bindingView.viewModel.updateAppInfo(appInfo)
    bindingView.viewModel.updateCustomItems(registeredCallbacks)
  }

  inline fun withBindingView(
    activity: Activity,
    crossinline action: (BindingView) -> Unit
  ) {
    activity.runOnUiThread {
      findBidingView(activity)?.let { bindingView ->
        updateStateIfNeeded(activity, bindingView)
        action(bindingView)
      } ?: Log.e(DEV_MENU_TAG, "BindingView not found in the activity hierarchy.")
    }
  }

  fun goToHome() {
    goToHomeAction()
  }

  override fun openMenu(activity: Activity, screen: String?) =
    withBindingView(activity) { bindingView ->
      bindingView.viewModel.onAction(DevMenuAction.Open)
    }

  // TODO(@lukmccall): pass activity
  override fun closeMenu() {
    withBindingView(activity = delegateActivity ?: return) { bindingView ->
      bindingView.viewModel.onAction(DevMenuAction.Close)
    }
  }

  override fun hideMenu() {
    withBindingView(activity = delegateActivity ?: return) { bindingView ->
      bindingView.viewModel.onAction(DevMenuAction.Close)
    }
  }

  override fun toggleMenu(activity: Activity) = withBindingView(activity) { bindingView ->
    if (bindingView.viewModel.state.isOpen) {
      bindingView.viewModel.onAction(DevMenuAction.Close)
    } else {
      bindingView.viewModel.onAction(DevMenuAction.Open)
    }
  }

  override fun onTouchEvent(ev: MotionEvent?) {
    threeFingerLongPressDetector?.onTouchEvent(ev)
  }

  override fun onKeyEvent(keyCode: Int, event: KeyEvent): Boolean {
    val imm = delegateActivity?.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    // The keyboard is active. We don't want to handle events that should go to text inputs.
    // RN uses onKeyUp to handle all events connected with dev options. We need to do the same to override them.
    // However, this event is also triggered when input is edited. A better way to handle that case
    // is use onKeyDown event. However, it doesn't work well with key commands and we can't override RN implementation in that approach.
    if (imm?.isAcceptingText != false) {
      return false
    }

    val keyCommand = KeyCommand(
      code = keyCode,
      withShift = event.modifiers and KeyEvent.META_SHIFT_MASK > 0
    )

    if (keyCommand == KeyCommand(KeyEvent.KEYCODE_MENU)) {
      delegateActivity?.let { openMenu(it) }
      return true
    }

    if (preferences?.keyCommandsEnabled != true) {
      return false
    }

    val action = when (keyCommand) {
      KeyCommand(KeyEvent.KEYCODE_R) -> ::reload
      KeyCommand(KeyEvent.KEYCODE_P) -> ::togglePerformanceMonitor
      KeyCommand(KeyEvent.KEYCODE_I) -> ::toggleInspector
      else -> return false
    }

    action()
    closeMenu()
    return true
  }

  fun reload() {
    val devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.reload()
  }

  fun togglePerformanceMonitor() {
    val devToolsDelegate = getDevToolsDelegate()
    delegateActivity?.let {
      devToolsDelegate?.togglePerformanceMonitor(it)
    }
  }

  fun toggleInspector() {
    val devToolsDelegate = getDevToolsDelegate()
    devToolsDelegate?.toggleElementInspector()
  }

  fun openJSInspector() {
    val devToolsDelegate = getDevToolsDelegate()
    // TOOD(@lukmccall): figure out if that's needed
//    // If internal setting aren't available we can't open inspector
//    if (devToolsDelegate?.devInternalSettings == null) {
//      return
//    }
    devToolsDelegate?.openJSInspector()
  }

  fun toggleFastRefresh() {
    val devToolsDelegate = getDevToolsDelegate()
    val internalSettings = devToolsDelegate?.devSettings
      ?: return

    val nextEnabled = !internalSettings.isHotModuleReplacementEnabled
    internalSettings.isHotModuleReplacementEnabled = nextEnabled

    if (nextEnabled) {
      delegateReactContext?.getJSModule(HMRClient::class.java)?.enable()
    } else {
      delegateReactContext?.getJSModule(HMRClient::class.java)?.disable()
    }
    if (nextEnabled && !internalSettings.isJSDevModeEnabled) {
      internalSettings.isJSDevModeEnabled = true
      devToolsDelegate.reload()
    }
  }

  fun toggleFab() {
    val current = preferences?.showFab ?: return
    preferences?.showFab = !current
  }

  override fun setDelegate(newDelegate: DevMenuDelegateInterface) {
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

  override fun initializeWithReactHost(reactHost: ReactHostWrapper) {
    setDelegate(DevMenuDefaultDelegate(reactHost))
  }

  override fun sendEventToDelegateBridge(eventName: String, eventData: Any?) {
    delegateReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(eventName, eventData)
  }

  override fun isInitialized(): Boolean {
    return delegate !== null
  }

  override val coroutineScope = CoroutineScope(Dispatchers.Default)

  override fun getSettings(): DevMenuPreferencesInterface? = preferences

  override fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    this.canLaunchDevMenuOnStart = canLaunchDevMenuOnStart
  }

  override fun synchronizeDelegate() {
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
//endregion
}
