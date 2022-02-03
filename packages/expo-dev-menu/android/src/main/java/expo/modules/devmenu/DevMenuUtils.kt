package expo.modules.devmenu

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSIModulePackage

const val DEV_MENU_TAG = "ExpoDevMenu"

fun getVendoredPackage(className: String): ReactPackage {
  return getVendoredClass(className, emptyArray(), emptyArray())
}

fun getVendoredJNIPackage(className: String): JSIModulePackage {
  return getVendoredClass(className, emptyArray(), emptyArray())
}

fun <T> getVendoredClass(className: String, argsType: Array<Class<*>>, args: Array<Any>): T {
  val clazz = try {
    Class.forName("devmenu.$className")
  } catch (e: ClassNotFoundException) {
    Class.forName(className)
  }

  return constructFromClass(clazz, argsType, args)
}

@Suppress("UNCHECKED_CAST")
fun <T> constructFromClass(clazz: Class<*>, argsType: Array<Class<*>>, args: Array<Any>): T {
  val constructor = clazz.getConstructor(*argsType)
  return constructor.newInstance(*args) as T
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
