package expo.modules.devmenu

import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage

const val DEV_MENU_TAG = "ExpoDevMenu"

internal fun ReactNativeHost.getReactModules(): List<ReactPackage> {
  val packageListClass = Class.forName("com.facebook.react.PackageList")
  val constructor = packageListClass.getConstructor(ReactNativeHost::class.java)
  val packageList = constructor.newInstance(this)
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
