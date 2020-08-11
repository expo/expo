package expo.modules.devmenu

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import org.unimodules.core.interfaces.Package

fun getExpoModules(application: Application): List<Package> {
  val basePackageListClass = Class.forName(application.packageName + ".generated.BasePackageList")
  val getPackageList = basePackageListClass.getMethod("getPackageList")
  @Suppress("UNCHECKED_CAST")
  return getPackageList.invoke(basePackageListClass.newInstance()) as List<Package>
}

fun getReactModules(reactNativeHost: ReactNativeHost): List<ReactPackage> {
  val packageListClass = Class.forName("com.facebook.react.PackageList")
  val constructor = packageListClass.getConstructor(ReactNativeHost::class.java)
  val packageList = constructor.newInstance(reactNativeHost)
  val getPackageList = packageListClass.getMethod("getPackages")
  @Suppress("UNCHECKED_CAST")
  return getPackageList.invoke(packageList) as List<ReactPackage>
}

fun setPrivateField(obj: Any, objClass: Class<*>, field: String, newValue: Any) =
  objClass.getDeclaredField(field).run {
    isAccessible = true
    set(obj, newValue)
  }

inline fun <reified T> getPrivateFiled(obj: Any, objClass: Class<*>, field: String) =
  objClass.getDeclaredField(field).run {
    isAccessible = true
    get(obj) as T
  }
