package expo.modules.devmenu

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.hardware.SensorManager
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.extensions.items.KeyCommand
import expo.modules.devmenu.interfaces.DevMenuDelegateInterface
import expo.modules.devmenu.interfaces.DevMenuExtensionInterface
import expo.modules.devmenu.interfaces.DevMenuManagerInterface
import expo.modules.devmenu.modules.DevMenuSettings
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider

object DevMenuManager : DevMenuManagerInterface, LifecycleEventListener {
  private var shakeDetector: ShakeDetector? = null
  private var session: DevMenuSession? = null
  private var settings: DevMenuSettings? = null
  private var delegate: DevMenuDelegateInterface? = null
  private var shouldLaunchDevMenuOnStart: Boolean = false
  private lateinit var devMenuHost: DevMenuHost
  private lateinit var cachedDevMenuItems: List<DevMenuItem>

  //region helpers

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

  private val delegateMenuItems: List<DevMenuItem>
    get() {
      if (!this::cachedDevMenuItems.isInitialized) {
        cachedDevMenuItems = delegateExtensions
          .map { it.devMenuItems() ?: emptyList() }
          .flatten()
          .sortedByDescending { it.importance }
      }

      return cachedDevMenuItems
    }

  private val delegateActions: List<DevMenuAction>
    get() = delegateMenuItems.filterIsInstance<DevMenuAction>()

  //endregion

  //region init

  @Suppress("UNCHECKED_CAST")
  fun maybeInitDevMenuHost(application: Application) {
    if (!this::devMenuHost.isInitialized) {
      devMenuHost = DevMenuHost(application)
      val packages = devMenuHost
        .getReactModules()
        .toMutableList()
        .apply {
          val expoModules = application.getExpoModules()
          add(ModuleRegistryAdapter(ReactModuleRegistryProvider(expoModules)))
        }
      devMenuHost.setPackages(packages)

      UiThreadUtil.runOnUiThread {
        devMenuHost.reactInstanceManager.createReactContextInBackground()
      }
    }
  }

  /**
   * Starts dev menu if wasn't initialized, prepares for opening menu at launch if needed and gets [DevMenuSettings].
   * We can't open dev menu here, cause then the app will crash - two react instance try to render.
   * So we wait until the [reactContext] activity will be ready.
   */
  private fun handleLoadedDelegate(reactContext: ReactContext) {
    maybeInitDevMenuHost(reactContext.currentActivity?.application
      ?: reactContext.applicationContext as Application)
    maybeStartDetectingShakes(devMenuHost.getContext())

    settings = reactContext
      .getNativeModule(DevMenuSettings::class.java)
      .also {
        shouldLaunchDevMenuOnStart = it.showsAtLaunch
        if (shouldLaunchDevMenuOnStart) {
          reactContext.addLifecycleEventListener(this)
        }
      }
  }

  //endregion

  //region shake detector

  /**
   * Starts [ShakeDetector] if it's not running yet.
   */
  private fun maybeStartDetectingShakes(context: Context) {
    if (shakeDetector != null) {
      return
    }
    shakeDetector = ShakeDetector { onShakeGesture() }.apply {
      start(context.getSystemService(Context.SENSOR_SERVICE) as SensorManager)
    }
  }

  /**
   * Handles shake gesture which simply toggles the dev menu.
   */
  private fun onShakeGesture() {
    if (settings?.motionGestureEnabled == true) {
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
      delegateActivity?.let {
        openMenu(it)
      }
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  //endregion

  //region DevMenuManagerProtocol

  override fun openMenu(activity: Activity) {
    session = DevMenuSession(delegate!!.reactInstanceManager(), delegate!!.appInfo())
    activity.startActivity(Intent(activity, DevMenuActivity::class.java))
  }

  /**
   * Sends an event to JS triggering the animation that collapses the dev menu.
   */
  override fun closeMenu() {
    hostReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("closeDevMenu", null)
  }

  override fun hideMenu() {
    hostActivity?.finish()
  }

  override fun toggleMenu(activity: Activity) {
    if (hostActivity?.isDestroyed == false) {
      closeMenu()
    } else {
      openMenu(activity)
    }
  }

  override fun onKeyEvent(keyCode: Int, event: KeyEvent): Boolean {
    if (settings?.keyCommandsEnabled != true) {
      return false
    }

    val keyCommand = KeyCommand(keyCode, event.modifiers)
    return delegateActions
      .find { it.keyCommand == keyCommand }
      ?.run {
        action()
        true
      } ?: false
  }

  override fun setDelegate(newDelegate: DevMenuDelegateInterface) {
    // removes event listener for old delegate
    delegateReactContext?.removeLifecycleEventListener(this)

    delegate = newDelegate.run {
      if (reactInstanceManager().currentReactContext == null) {
        reactInstanceManager().addReactInstanceEventListener(this@DevMenuManager::handleLoadedDelegate)
      } else {
        handleLoadedDelegate(reactInstanceManager().currentReactContext!!)
      }
      this
    }
  }

  override fun dispatchAction(actionId: String) {
    delegateActions
      .find { it.actionId == actionId }
      ?.run { action() }
  }

  override fun serializedItems(): List<Bundle> = delegateMenuItems.map { it.serialize() }

  override fun getSession(): DevMenuSession? = session

  override fun getSettings(): DevMenuSettings? = settings

  override fun getMenuHost() = devMenuHost

  //endregion
}

