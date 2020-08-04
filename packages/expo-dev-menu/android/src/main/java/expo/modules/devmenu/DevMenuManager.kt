package expo.modules.devmenu

import android.app.Activity
import android.app.Application
import android.content.Intent
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import expo.modules.devmenu.modules.DevMenuHost
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider
import org.unimodules.core.interfaces.Package
import java.lang.ref.WeakReference

object DevMenuManager {
  private var devServerPort = AndroidInfoHelpers.sDevServerPortOverride
  private lateinit var devMenuHost: DevMenuHost
  private var currentDevMenuActivity: WeakReference<DevMenuActivity?> = WeakReference(null)

  @Suppress("UNCHECKED_CAST")
  fun initDevMenuHost(application: Application) {
    devMenuHost = DevMenuHost(application)
    val packages = getReactModules(devMenuHost).toMutableList()
    packages.add(ModuleRegistryAdapter(ReactModuleRegistryProvider(getExpoModules(application) as List<Package>)))
    devMenuHost.setPackages(packages as List<ReactPackage>)
  }

  fun getDevMenuHost() = devMenuHost

  fun openMenu(activity: Activity) {
    devServerPort = AndroidInfoHelpers.sDevServerPortOverride;
    AndroidInfoHelpers.sDevServerPortOverride = 2137
    activity.startActivity(Intent(activity, DevMenuActivity::class.java))
  }

  fun closeMenu() {
    devMenuHost.reactInstanceManager.currentReactContext
      ?.catalystInstance
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("closeDevMenu", null)
  }

  fun hideMenu() {
    currentDevMenuActivity.get()?.let {
      it.finish()
    }
  }

  fun devMenuHasBeenDestroyed() {
    currentDevMenuActivity = WeakReference(null)
    AndroidInfoHelpers.sDevServerPortOverride = devServerPort
  }

  fun devMenuHasOpened(devMenuActivity: DevMenuActivity) {
    currentDevMenuActivity = WeakReference(devMenuActivity)
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
