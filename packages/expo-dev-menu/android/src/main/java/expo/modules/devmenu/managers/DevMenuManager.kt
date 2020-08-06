package expo.modules.devmenu.managers

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.BuildConfig
import expo.modules.devmenu.DevMenuActivity
import expo.modules.devmenu.DevMenuSession
import expo.modules.devmenu.modules.DevMenuSettings
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.DevMenuHost
import expo.modules.devmenu.protocoles.DevMenuDelegateProtocol
import expo.modules.devmenu.protocoles.DevMenuExtensionProtocol
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider
import org.unimodules.core.interfaces.Package

object DevMenuManager : LifecycleEventListener {
  private val bundlerManager: DebugBundlerManager? = null

  //    if (BuildConfig.DEBUG) {
//      DebugBundlerManager()
//    } else {
//      null
//    }
  private var session: DevMenuSession? = null
  private var delegate: DevMenuDelegateProtocol? = null
  private val extensions: Collection<DevMenuExtensionProtocol>
    get() {
      return delegate?.reactInstanceManager()?.currentReactContext?.catalystInstance?.nativeModules?.filterIsInstance<DevMenuExtensionProtocol>()
        ?: emptyList()
    }
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
      it.addLifecycleEventListener(this)
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
    devMenuHost.reactInstanceManager.currentReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("closeDevMenu", null)
  }

  fun hideMenu() {
    devMenuHost.reactInstanceManager?.currentReactContext?.currentActivity?.finish()
  }

  fun runWithApplicationBundler(action: () -> Unit) = synchronized(this) {
    bundlerManager?.switchBundler()
    action()
    bundlerManager?.switchBundler()
  }

  fun setDelegate(newDelegate: DevMenuDelegateProtocol) {
    delegate = newDelegate
    delegate?.reactInstanceManager()?.addReactInstanceEventListener {
      if (it.getNativeModule(DevMenuSettings::class.java).showsAtLaunch) {
        delegate?.reactInstanceManager()?.currentReactContext?.currentActivity?.let { activity ->
          openMenu(activity)
        }
      }
    }
  }

  fun serializedDevMenuItems(): List<Bundle> = devMenuItems.map { it.serialize() }

  fun dispatchAction(actionId: String) {
    devMenuItems.forEach {
      if (it is DevMenuAction && it.actionId == actionId) {
        it.action()
        return
      }
    }
  }

  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    bundlerManager?.switchBundler()
  }
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
