package expo.modules.kotlin.viewevent

import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.types.putGeneric
import kotlin.reflect.KType

fun interface ViewEventCallback<T> {
  operator fun invoke(arg: T)
}

class ViewEvent<T>(
  private val name: String,
  private val type: KType,
  private val view: View,
  private val coalescingKey: CoalescingKey<T>?
) : ViewEventCallback<T> {
  internal lateinit var module: Module

  override operator fun invoke(arg: T) {
    val reactContext = view.context as ReactContext
    val nativeModulesProxy = reactContext
      .catalystInstance
      ?.getNativeModule("NativeUnimoduleProxy") as? NativeModulesProxy
      ?: return
    val appContext = nativeModulesProxy.kotlinInteropModuleRegistry.appContext

    appContext
      .callbackInvoker
      ?.emit(
        viewId = view.id,
        eventName = name,
        eventBody = convertEventBody(arg),
        coalescingKey = coalescingKey?.invoke(arg)
      )
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
