package expo.modules.devmenu

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.graphics.Typeface
import android.hardware.SensorManager
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.inputmethod.InputMethodManager
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.*
import com.facebook.react.views.text.ReactFontManager
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.interfaces.devmenu.DevMenuDelegateInterface
import expo.interfaces.devmenu.DevMenuExtensionInterface
import expo.interfaces.devmenu.DevMenuExtensionSettingsInterface
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.interfaces.devmenu.DevMenuPreferencesInterface
import expo.interfaces.devmenu.items.DevMenuCallableProvider
import expo.interfaces.devmenu.items.DevMenuDataSourceInterface
import expo.interfaces.devmenu.items.DevMenuDataSourceItem
import expo.interfaces.devmenu.items.DevMenuExportedAction
import expo.interfaces.devmenu.items.DevMenuExportedCallable
import expo.interfaces.devmenu.items.DevMenuExportedFunction
import expo.interfaces.devmenu.items.DevMenuItemsContainerInterface
import expo.interfaces.devmenu.items.DevMenuScreen
import expo.interfaces.devmenu.items.DevMenuScreenItem
import expo.interfaces.devmenu.items.KeyCommand
import expo.interfaces.devmenu.items.getItemsOfType
import expo.modules.devmenu.api.DevMenuMetroClient
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.devmenu.modules.DevMenuPreferencesHandle
import expo.modules.devmenu.react.DevMenuPackagerCommandHandlersSwapper
import expo.modules.devmenu.react.DevMenuShakeDetectorListenerSwapper
import expo.modules.devmenu.tests.DevMenuDisabledTestInterceptor
import expo.modules.devmenu.tests.DevMenuTestInterceptor
import expo.modules.devmenu.websockets.DevMenuCommandHandlersProvider
import expo.modules.manifests.core.Manifest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.lang.ref.WeakReference

object DevMenuManager : DevMenuManagerInterface, LifecycleEventListener {
  data class Callback(val name: String, val shouldCollapse: Boolean)

  val metroClient: DevMenuMetroClient by lazy { DevMenuMetroClient() }
  private var fontsWereLoaded = false

  private var shakeDetector: ShakeDetector? = null
  private var threeFingerLongPressDetector: ThreeFingerLongPressDetector? = null
  private var preferences: DevMenuPreferencesInterface? = null
  internal var delegate: DevMenuDelegateInterface? = null
  private var extensionSettings: DevMenuExtensionSettingsInterface = DevMenuDefaultExtensionSettings(this)
  private var shouldLaunchDevMenuOnStart: Boolean = false
  private lateinit var devMenuHost: DevMenuHost
  private var currentReactInstanceManager: WeakReference<ReactInstanceManager?> = WeakReference(null)
  private var currentScreenName: String? = null
  private var canLaunchDevMenuOnStart = true
  var testInterceptor: DevMenuTestInterceptor = DevMenuDisabledTestInterceptor()

  var currentManifest: Manifest? = null
  var currentManifestURL: String? = null

  //region helpers

  fun getReactInstanceManager(): ReactInstanceManager? {
    return delegate?.reactInstanceManager()
  }

  private val delegateReactContext: ReactContext?
    get() = delegate?.reactInstanceManager()?.currentReactContext

  private val delegateActivity: Activity?
    get() = delegateReactContext?.currentActivity

  private val hostReactContext: ReactContext?
    get() = devMenuHost.reactInstanceManager.currentReactContext

  private val hostActivity: Activity?
    get() = hostReactContext?.currentActivity

  /**
   * Returns an collection of modules conforming to [DevMenuExtensionInterface].
   * Bridge may register multiple modules with the same name – in this case it returns only the one that overrides the others.
   */
  private val delegateExtensions: Collection<DevMenuExtensionInterface>
    get() {
      val catalystInstance = delegateReactContext?.catalystInstance ?: return emptyList()
      val uniqueExtensionNames = catalystInstance
        .nativeModules
        .filterIsInstance<DevMenuExtensionInterface>()
        .map { it.getName() }
        .toSet()

      return uniqueExtensionNames
        .map { extensionName ->
          catalystInstance.getNativeModule(extensionName) as DevMenuExtensionInterface
        }
    }

  private val cachedDevMenuDataSources by KeyValueCachedProperty<ReactInstanceManager, List<DevMenuDataSourceInterface>> {
    delegateExtensions
      .map { it.devMenuDataSources(extensionSettings) ?: emptyList() }
      .flatten()
  }

  private val dataSources: List<DevMenuDataSourceInterface>
    get() {
      val delegateBridge = delegate?.reactInstanceManager() ?: return emptyList()
      return cachedDevMenuDataSources[delegateBridge]
    }

  private val cachedDevMenuScreens by KeyValueCachedProperty<ReactInstanceManager, List<DevMenuScreen>> {
    delegateExtensions
      .map { it.devMenuScreens(extensionSettings) ?: emptyList() }
      .flatten()
  }

  private val delegateScreens: List<DevMenuScreen>
    get() {
      val delegateBridge = delegate?.reactInstanceManager() ?: return emptyList()
      return cachedDevMenuScreens[delegateBridge]
    }

  private val cachedDevMenuItems by KeyValueCachedProperty<ReactInstanceManager, List<DevMenuItemsContainerInterface>> {
    delegateExtensions
      .mapNotNull { it.devMenuItems(extensionSettings) }
  }

  private val delegateMenuItemsContainers: List<DevMenuItemsContainerInterface>
    get() {
      val delegateBridge = delegate?.reactInstanceManager() ?: return emptyList()
      return cachedDevMenuItems[delegateBridge]
    }

  private val delegateRootMenuItems: List<DevMenuScreenItem>
    get() =
      delegateMenuItemsContainers
        .map { it.getRootItems() }
        .flatten()
        .sortedBy { -it.importance }

  private fun getCallable(): List<DevMenuExportedCallable> {
    if (currentScreenName == null) {
      return delegateMenuItemsContainers
        .map {
          it
            .getItemsOfType<DevMenuCallableProvider>()
            .mapNotNull { provider -> provider.registerCallable() }
        }
        .flatten()
    }

    val screen = delegateScreens.find { it.screenName == currentScreenName } ?: return emptyList()
    return screen
      .getItemsOfType<DevMenuCallableProvider>()
      .mapNotNull { it.registerCallable() }
  }

  //endregion

  //region init

  @Suppress("UNCHECKED_CAST")
  private fun maybeInitDevMenuHost(application: Application) {
    if (!this::devMenuHost.isInitialized) {
      devMenuHost = DevMenuHost(application)
      UiThreadUtil.runOnUiThread {
        devMenuHost.reactInstanceManager.createReactContextInBackground()
      }
    }
  }

  private fun setUpReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    currentReactInstanceManager = WeakReference(reactInstanceManager)

    val handlers = DevMenuCommandHandlersProvider(this, reactInstanceManager)
      .createCommandHandlers()

    DevMenuPackagerCommandHandlersSwapper()
      .swapPackagerCommandHandlers(
        reactInstanceManager,
        handlers
      )

    DevMenuShakeDetectorListenerSwapper()
      .swapShakeDetectorListener(
        reactInstanceManager
      ) {}

    if (reactInstanceManager.currentReactContext == null) {
      reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceManager.ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          if (currentReactInstanceManager.get() === reactInstanceManager) {
            handleLoadedDelegateContext(context)
          }
          reactInstanceManager.removeReactInstanceEventListener(this)
        }
      })
    } else {
      handleLoadedDelegateContext(reactInstanceManager.currentReactContext!!)
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

    maybeInitDevMenuHost(
      reactContext.currentActivity?.application
        ?: reactContext.applicationContext as Application
    )
    maybeStartDetectors(devMenuHost.getContext())
    preferences = (
      testInterceptor.overrideSettings()
        ?: DevMenuPreferencesHandle(reactContext)
      ).also {
      if (hasDisableOnboardingQueryParam(currentManifestURL.orEmpty())) {
        it.isOnboardingFinished = true
      }
    }.also {
      shouldLaunchDevMenuOnStart = canLaunchDevMenuOnStart && (it.showsAtLaunch || !it.isOnboardingFinished)
      if (shouldLaunchDevMenuOnStart) {
        reactContext.addLifecycleEventListener(this)
      }
    }
  }

  fun getAppInfo(): Bundle {
    val reactContext = delegateReactContext ?: return Bundle.EMPTY
    val instanceManager = delegate?.reactInstanceManager() ?: return Bundle.EMPTY

    return DevMenuAppInfo.getAppInfo(instanceManager, reactContext)
  }

  fun getDevSettings(): Bundle {
    if (delegate?.reactInstanceManager() != null) {
      val reactInstanceManager = delegate!!.reactInstanceManager()
      return DevMenuDevSettings.getDevSettings(reactInstanceManager)
    }

    return Bundle.EMPTY
  }

  fun loadFonts(context: Context) {
    if (fontsWereLoaded) {
      return
    }
    fontsWereLoaded = true

    val fonts = arrayOf(
      "Inter-Black",
      "Inter-ExtraBold",
      "Inter-Bold",
      "Inter-SemiBold",
      "Inter-Medium",
      "Inter-Regular",
      "Inter-Light",
      "Inter-ExtraLight",
      "Inter-Thin"
    )

    val assets = context.assets

    fonts.map { familyName ->
      val font = Typeface.createFromAsset(assets, "$familyName.otf")
      ReactFontManager.getInstance().setTypeface(familyName, Typeface.NORMAL, font)
    }
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

  override fun openMenu(activity: Activity, screen: String?) {
    setCurrentScreen(null)

    activity.startActivity(Intent(activity, DevMenuActivity::class.java))
  }

  /**
   * Triggers the animation that collapses the dev menu.
   */
  override fun closeMenu() {
    val activity = hostActivity as? DevMenuActivity ?: return
    if (!activity.isDestroyed) {
      activity.closeBottomSheet()
    }
  }

  override fun hideMenu() {
    setCurrentScreen(null)
    hostActivity?.finish()
  }

  override fun toggleMenu(activity: Activity) {
    if (hostActivity?.isDestroyed == false) {
      closeMenu()
    } else {
      openMenu(activity)
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

    if (keyCode == KeyEvent.KEYCODE_MENU) {
      delegateActivity?.let { openMenu(it) }
      return true
    }

    if (preferences?.keyCommandsEnabled != true) {
      return false
    }

    val keyCommand = KeyCommand(
      code = keyCode,
      withShift = event.modifiers and KeyEvent.META_SHIFT_MASK > 0
    )
    return getCallable()
      .filterIsInstance<DevMenuExportedAction>()
      .find { it.keyCommand == keyCommand }
      ?.run {
        if (isAvailable()) {
          action()
          closeMenu()
        }
        true
      } ?: false
  }

  override fun setDelegate(newDelegate: DevMenuDelegateInterface) {
    Log.i(DEV_MENU_TAG, "Set new dev-menu delegate: ${newDelegate.javaClass}")
    // removes event listener for old delegate
    delegateReactContext?.removeLifecycleEventListener(this)

    delegate = newDelegate.apply {
      setUpReactInstanceManager(this.reactInstanceManager())
    }
  }

  override fun initializeWithReactNativeHost(reactNativeHost: ReactNativeHost) {
    setDelegate(DevMenuDefaultDelegate(reactNativeHost))
  }

  override fun dispatchCallable(actionId: String, args: ReadableMap?) {
    getCallable()
      .find { it.id == actionId }
      ?.run {
        when (this) {
          is DevMenuExportedAction -> {
            if (args != null) {
              Log.e("DevMenu", "Action $actionId was called with arguments.")
            }

            call()
          }
          is DevMenuExportedFunction -> call(args)
        }
      }
  }

  override fun sendEventToDelegateBridge(eventName: String, eventData: Any?) {
    delegateReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(eventName, eventData)
  }

  override fun isInitialized(): Boolean {
    return delegate !== null
  }

  override suspend fun fetchDataSource(id: String): List<DevMenuDataSourceItem> {
    return dataSources
      .find { it.id == id }
      ?.run { fetchData() } ?: emptyList()
  }

  override val coroutineScope = CoroutineScope(Dispatchers.Default)

  override fun serializedItems(): List<Bundle> = delegateRootMenuItems.map { it.serialize() }

  override fun serializedScreens(): List<Bundle> = delegateScreens.map { it.serialize() }

  override fun getSettings(): DevMenuPreferencesInterface? = preferences

  override fun getMenuHost(): ReactNativeHost = devMenuHost

  override fun setCanLaunchDevMenuOnStart(canLaunchDevMenuOnStart: Boolean) {
    this.canLaunchDevMenuOnStart = canLaunchDevMenuOnStart
  }

  override fun synchronizeDelegate() {
    val newReactInstanceManager = requireNotNull(delegate).reactInstanceManager()
    if (newReactInstanceManager != currentReactInstanceManager.get()) {
      setUpReactInstanceManager(newReactInstanceManager)
    }
  }

  override fun setCurrentScreen(screen: String?) {
    currentScreenName = screen
  }

  fun getMenuPreferences(): Bundle {
    return Bundle().apply {
      putBoolean("isOnboardingFinished", getSettings()?.isOnboardingFinished ?: false)
    }
  }

  //endregion
}
