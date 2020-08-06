package expo.modules.devmenu.managers

import android.app.Activity
import android.app.Application
import android.os.Bundle
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.BuildConfig
import expo.modules.devmenu.DevMenuDelegateProtocol
import expo.modules.devmenu.DevMenuSession
import expo.modules.devmenu.extensions.DevMenuExtensionProtocol
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.modules.DevMenuHost
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider
import org.unimodules.core.interfaces.Package

object DevMenuManager {
  private val devMenuActivityManager =
    if (BuildConfig.DEBUG) {
      DebugDevMenuActivityManager()
    } else {
      DevMenuActivityManager()
    }
  private var session: DevMenuSession? = null
  private var delegate: DevMenuDelegateProtocol? = null
  private val extensions: Collection<DevMenuExtensionProtocol>
    get() {
      return delegate?.reactInstanceManager()?.currentReactContext?.catalystInstance?.nativeModules?.filterIsInstance<DevMenuExtensionProtocol>()
        ?: emptyList()
    }
  private val devMenuItems: List<DevMenuItem>
    get() {
      return extensions.map {
        it.devMenuItems() ?: emptyList()
      }.flatten()
    }
  private lateinit var devMenuHost: DevMenuHost

  @Suppress("UNCHECKED_CAST")
  fun initDevMenuHost(application: Application) {
    devMenuHost = DevMenuHost(application)
    val packages = getReactModules(devMenuHost).toMutableList()
    packages.add(ModuleRegistryAdapter(ReactModuleRegistryProvider(getExpoModules(application) as List<Package>)))
    devMenuHost.setPackages(packages as List<ReactPackage>)
  }

  fun getDevMenuHost() = devMenuHost

  fun openMenu(activity: Activity) {
    session = DevMenuSession(delegate!!.reactInstanceManager(), delegate!!.appInfo())
    devMenuActivityManager.openMenu(activity)
  }

  fun getSession() = session

  fun closeMenu() {
    devMenuHost.reactInstanceManager.currentReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("closeDevMenu", null)
  }

  fun getDevMenuLifecycleHandler() = devMenuActivityManager

  fun hideMenu() {
    devMenuActivityManager.hideMenu()
  }

  fun runWithApplicationBundler(action: () -> Unit) = synchronized(this) {
    devMenuActivityManager.switchBundler()
    action()
    devMenuActivityManager.switchBundler()
  }

  fun setDelegate(newDelegate: DevMenuDelegateProtocol) {
    delegate = newDelegate
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
