package expo.modules.kotlin.callbacks

import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.types.putGeneric
import kotlin.reflect.KType

class ViewCallback<T>(
  private val name: String,
  private val type: KType,
  private val view: View
) : Callback<T> {
  internal lateinit var module: Module

  override operator fun invoke(arg: T) {
    val reactContext = view.context as ReactContext
    val nativeModulesProxy = reactContext
      .catalystInstance
      ?.getNativeModule("NativeUnimoduleProxy") as? NativeModulesProxy
      ?: return
    val appContext = nativeModulesProxy.kotlinInteropModuleRegistry.appContext

    appContext.callbackInvoker?.emit(view.id, name, convertEventBody(arg))
  }

  private fun convertEventBody(arg: T): WritableMap? {
    return when (val converted = JSTypeConverter.convertToJSValue(arg)) {
      is Unit, null -> null
      is WritableMap -> converted
      else -> JSTypeConverter.DefaultContainerProvider.createMap().apply {
        putGeneric("payload", converted)
      }
    }
  }
}
