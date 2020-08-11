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
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.detectors.ShakeDetector
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.extensions.items.KeyCommand
import expo.modules.devmenu.modules.DevMenuSettings
import expo.modules.devmenu.protocoles.DevMenuDelegateProtocol
import expo.modules.devmenu.protocoles.DevMenuExtensionProtocol
import expo.modules.devmenu.protocoles.DevMenuManagerProtocol
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider

object DevMenuManager : DevMenuManagerProtocol, LifecycleEventListener {
  private var shakeDetector: ShakeDetector? = null
  private var session: DevMenuSession? = null
  private var settings: DevMenuSettings? = null
  private var delegate: DevMenuDelegateProtocol? = null
  private var shouldLaunchDevMenuOnStart: Boolean = false
  private lateinit var devMenuHost: DevMenuHost

  //region helpers

  private val delegateReactContext: ReactContext?
    get() = delegate?.reactInstanceManager()?.currentReactContext

  private val delegateActivity: Activity?
    get() = delegateReactContext?.currentActivity

  private val hostReactContext: ReactContext?
    get() = devMenuHost.reactInstanceManager.currentReactContext

  private val hostActivity: Activity?
    get() = hostReactContext?.currentActivity

  private val delegateExtensions: Collection<DevMenuExtensionProtocol>
    get() = delegateReactContext
      ?.catalystInstance
      ?.nativeModules
      ?.filterIsInstance<DevMenuExtensionProtocol>()
      ?: emptyList()

  private val delegateMenuItems: List<DevMenuItem>
    get() = delegateExtensions
      .map { it.devMenuItems() ?: emptyList() }
      .flatten()
      .sortedByDescending { it.importance }

  private val delegateActions: List<DevMenuAction>
    get() = delegateMenuItems.filterIsInstance<DevMenuAction>()

  //endregion

  //region init

  @Suppress("UNCHECKED_CAST")
  fun initDevMenuHost(application: Application) {
    devMenuHost = DevMenuHost(application)
    val packages = getReactModules(devMenuHost)
      .toMutableList()
      .apply {
        val expoModules = getExpoModules(application)
        add(ModuleRegistryAdapter(ReactModuleRegistryProvider(expoModules)))
      }
    devMenuHost.setPackages(packages)
  }

  private fun handleLoadedDelegate(reactContext: ReactContext) {
    reactContext.addLifecycleEventListener(this)
    settings = reactContext.getNativeModule(DevMenuSettings::class.java).also {
      shouldLaunchDevMenuOnStart = it.showsAtLaunch
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
    val keyCommand = KeyCommand(keyCode, event.modifiers)
    delegateActions.forEach {
      if (it.keyCommand == keyCommand) {
        it.action()
        return true
      }
    }

    return false
  }

  override fun setDelegate(newDelegate: DevMenuDelegateProtocol) {
    // remove event listener for old delegate
    delegateReactContext?.removeLifecycleEventListener(this)

    maybeStartDetectingShakes(devMenuHost.getContext())
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
    delegateMenuItems.forEach {
      if (it is DevMenuAction && it.actionId == actionId) {
        it.action()
        return
      }
    }
  }

  override fun serializedItems(): List<Bundle> = delegateMenuItems.map { it.serialize() }

  override fun getSession(): DevMenuSession? = session

  override fun getSettings(): DevMenuSettings? = settings

  override fun getMenuHost() = devMenuHost

  //endregion
}

