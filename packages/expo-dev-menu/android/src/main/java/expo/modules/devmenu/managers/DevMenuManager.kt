package expo.modules.devmenu.managers

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.hardware.SensorManager
import android.os.Bundle
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.DevHostLifecycleEventListener
import expo.modules.devmenu.DevMenuActivity
import expo.modules.devmenu.DevMenuSession
import expo.modules.devmenu.modules.DevMenuSettings
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.DevMenuHost
import expo.modules.devmenu.ShakeDetector
import expo.modules.devmenu.protocoles.DevMenuDelegateProtocol
import expo.modules.devmenu.protocoles.DevMenuExtensionProtocol
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider
import org.unimodules.core.interfaces.Package

object DevMenuManager : LifecycleEventListener {
  private var shakeDetector: ShakeDetector? = null
  private val bundlerManager: DebugBundlerManager? = null
  private val devHostLifecycleEventListener = DevHostLifecycleEventListener(bundlerManager)

  //    if (BuildConfig.DEBUG) {
//      DebugBundlerManager()
//    } else {
//      null
//    }
  private var session: DevMenuSession? = null
  var settings: DevMenuSettings? = null
    private set
  private var delegate: DevMenuDelegateProtocol? = null
  private var shouldLaunchDevMenuOnStart: Boolean = false
  private val extensions: Collection<DevMenuExtensionProtocol>
    get() = delegateReactContext
      ?.catalystInstance
      ?.nativeModules
      ?.filterIsInstance<DevMenuExtensionProtocol>()
      ?: emptyList()


  private val devMenuItems: List<DevMenuItem>
    get() = extensions
      .map { it.devMenuItems() ?: emptyList() }
      .flatten()
      .sortedByDescending { it.importance }

  private lateinit var devMenuHost: DevMenuHost

  @Suppress("UNCHECKED_CAST")
  fun initDevMenuHost(application: Application) {
    devMenuHost = DevMenuHost(application)
    val packages = getReactModules(devMenuHost).toMutableList()
    packages.add(ModuleRegistryAdapter(ReactModuleRegistryProvider(getExpoModules(application) as List<Package>)))
    devMenuHost.setPackages(packages as List<ReactPackage>)

    devMenuHost.reactInstanceManager.addReactInstanceEventListener {
      it.addLifecycleEventListener(devHostLifecycleEventListener)
    }
  }

  fun getDevMenuHost() = devMenuHost

  fun openMenu(activity: Activity) {
    session = DevMenuSession(delegate!!.reactInstanceManager(), delegate!!.appInfo())
    bundlerManager?.switchBundler()
    activity.startActivity(Intent(activity, DevMenuActivity::class.java))
  }

  fun getSession() = session

  fun closeMenu() {
    hostReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("closeDevMenu", null)
  }

  fun hideMenu() {
    hostActivity?.finish()
  }

  fun toggleMenu(activity: Activity) {
    if (hostActivity?.isDestroyed == false) {
      closeMenu()
    } else {
      openMenu(activity)
    }
  }

  fun runWithApplicationBundler(action: () -> Unit) = synchronized(this) {
    bundlerManager?.switchBundler()
    action()
    bundlerManager?.switchBundler()
  }

  fun setDelegate(newDelegate: DevMenuDelegateProtocol) {
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

  private fun handleLoadedDelegate(reactContext: ReactContext) {
    reactContext.addLifecycleEventListener(this)
    settings = reactContext.getNativeModule(DevMenuSettings::class.java).also {
      shouldLaunchDevMenuOnStart = it.showsAtLaunch
    }
  }

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

  private val delegateReactContext: ReactContext?
    get() = delegate?.reactInstanceManager()?.currentReactContext

  private val delegateActivity: Activity?
    get() = delegateReactContext?.currentActivity


  private val hostReactContext: ReactContext?
    get() = devMenuHost.reactInstanceManager.currentReactContext

  private val hostActivity: Activity?
    get() = hostReactContext?.currentActivity

  fun serializedDevMenuItems(): List<Bundle> = devMenuItems.map { it.serialize() }

  fun dispatchAction(actionId: String) {
    devMenuItems.forEach {
      if (it is DevMenuAction && it.actionId == actionId) {
        it.action()
        return
      }
    }
  }

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
}

fun getExpoModules(application: Application): List<*> {
  val basePackageListClass = Class.forName(application.packageName + ".generated.BasePackageList")
  val getPackageList = basePackageListClass.getMethod("getPackageList")
  return getPackageList.invoke(basePackageListClass.newInstance()) as List<*>
}

fun getReactModules(reactNativeHost: ReactNativeHost): List<*> {
  val packageListClass = Class.forName("com.facebook.react.PackageList")
  val ctor = packageListClass.getConstructor(ReactNativeHost::class.java)
  val packageList = ctor.newInstance(reactNativeHost)
  val getPackageList = packageListClass.getMethod("getPackages")
  return getPackageList.invoke(packageList) as List<*>
}
